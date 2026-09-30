const VISION_SYSTEM_PROMPT = `You analyze a single still photo of a meal for geometric measurement.

Your job is to identify:
1. One scale reference beside the food: US coin/bill, Israeli coin/bill, or an ID-1 card.
2. Visible foods, whether each is separate or part of one mixed cooked dish.
3. Each food's approximate width, depth, and height as multiples of the reference span.
4. At most three selectable affirmative statements for information pixels cannot reveal,
   such as "Sugar was added to the cucumbers" or "The sauce is sweetened."

Reference span means coin diameter, or the short edge of a bill/card. Compare food and
reference in the same plane. Prefer a top-down photo. If height is unclear, use a
conservative cooked-food prior and say so in assumptions.
Use shape "mixed" for fried rice, stew, curry, casserole, or another inseparable dish.
The unknowns array must contain statements that are true when selected, not questions.
Never estimate carbohydrate grams. Never transcribe names, card numbers, bill serials,
or any other text unrelated to denomination. If a card is visible, classify its outline only.`;

const VISION_SCHEMA = {
  name: "meal_geometry",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["reference", "items", "unknowns"],
    properties: {
      reference: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "confidence"],
        properties: {
          key: {
            type: ["string", "null"],
            enum: [
              "us_dime",
              "us_penny",
              "us_nickel",
              "us_quarter",
              "us_dollar_coin",
              "us_half_dollar",
              "us_bill",
              "ils_10_agorot",
              "ils_half_shekel",
              "ils_1_shekel",
              "ils_2_shekel",
              "ils_5_shekel",
              "ils_10_shekel",
              "ils_20_bill",
              "ils_50_bill",
              "ils_100_bill",
              "ils_200_bill",
              "id1_card",
              null,
            ],
          },
          label: { type: "string" },
          confidence: { type: "number" },
        },
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "name",
            "searchTerm",
            "form",
            "densityKey",
            "mixedDish",
            "confidence",
            "assumptions",
            "geometry",
          ],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            searchTerm: { type: "string" },
            form: { type: "string" },
            densityKey: {
              type: "string",
              enum: [
                "cooked_rice",
                "cooked_pasta",
                "potato",
                "tofu",
                "bread",
                "cooked_vegetables",
                "raw_vegetables",
                "fruit",
                "beans",
                "stew",
                "soup",
                "mixed_dish",
                "generic_food",
              ],
            },
            mixedDish: { type: "boolean" },
            confidence: { type: "number" },
            assumptions: {
              type: "array",
              items: { type: "string" },
            },
            geometry: {
              type: "object",
              additionalProperties: false,
              required: [
                "shape",
                "widthReferenceUnits",
                "depthReferenceUnits",
                "heightReferenceUnits",
              ],
              properties: {
                shape: {
                  type: "string",
                  enum: ["cuboid", "cylinder", "mound", "slice", "mixed", "irregular"],
                },
                widthReferenceUnits: { type: "number" },
                depthReferenceUnits: { type: "number" },
                heightReferenceUnits: { type: "number" },
              },
            },
          },
        },
      },
      unknowns: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
};

const HIDDEN_NOTES_SCHEMA = {
  name: "hidden_foods",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "searchTerm", "grams", "assumption"],
          properties: {
            name: { type: "string" },
            searchTerm: { type: "string" },
            grams: { type: "number" },
            assumption: { type: "string" },
          },
        },
      },
    },
  },
};

async function analyzePhoto(client, imageBase64) {
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL || "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_schema", json_schema: VISION_SCHEMA },
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "This is one still photo of a meal with a size reference beside it. Return the structured meal geometry.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  parsed.reference.confidence = Math.min(
    Math.max(Number(parsed.reference.confidence) || 0, 0),
    1,
  );
  parsed.items = parsed.items.slice(0, 12).map((item) => ({
    ...item,
    confidence: Math.min(Math.max(Number(item.confidence) || 0, 0), 1),
    assumptions: item.assumptions.slice(0, 4),
  }));
  parsed.unknowns = parsed.unknowns.slice(0, 3);
  if (parsed.items.length === 0) {
    throw new Error("No food was recognized in the scan.");
  }
  return parsed;
}

async function parseHiddenNotes(client, notes) {
  if (!notes.trim()) return [];

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_schema", json_schema: HIDDEN_NOTES_SCHEMA },
    messages: [
      {
        role: "system",
        content:
          "Extract only hidden or added foods from the user's note. Estimate mass from explicit household quantities when necessary. Do not calculate carbohydrates. If no hidden food is stated, return an empty items array.",
      },
      { role: "user", content: notes },
    ],
  });

  return JSON.parse(response.choices[0].message.content).items
    .slice(0, 8)
    .map((item) => ({
      ...item,
      grams: Math.min(Math.max(Number(item.grams) || 0, 0), 1000),
    }));
}

module.exports = { analyzePhoto, parseHiddenNotes };
