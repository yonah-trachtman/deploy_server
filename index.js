import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

const app = new Hono();
app.use("*", cors());

app.post("/api/chat", async (c) => {
  const { image, message, expectsJson } = await c.req.json();

  if (!image) {
    return c.json({ error: "No image provided." }, 400);
  }

  const client = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",


      ...(expectsJson
        ? {
            text: {
              format: { type: "json_object" },
            },
          }
        : {}),

      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: expectsJson
                ? `${message}

IMPORTANT:
Respond ONLY with valid JSON.`
                : message,
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`,
            },
          ],
        },
      ],
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "";

    console.log("OpenAI reply:", output);

    return c.json({ reply: output });

  } catch (err) {
    console.error("OpenAI error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

export default app;
