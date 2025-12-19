import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

const app = new Hono();

app.use("*", cors());

app.post("/api/chat", async (c) => {
  const { image, message } = await c.req.json();

  if (!image) {
    return c.json({ error: "No image provided." }, 400);
  }

  const client = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
  });

  try {
    const stream = await client.responses.stream({
      model: "gpt-4.1-mini",
      text: {
  format: { type: "json_object" }
},
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: message },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`,
            },
          ],
        },
      ],
    });

    let buffer = "";

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        buffer += event.delta;
      }
    }

    console.log(buffer);
    return c.json({ reply: buffer });

  } catch (err) {
    console.error(err);
    return c.json({ error: err.message ?? "Unknown error" }, 500);
  }
});

export default app;
