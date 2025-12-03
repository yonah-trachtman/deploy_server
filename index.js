import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

// Global scope = cached between requests
const client = new OpenAI();
const app = new Hono();

app.use("*", cors());

app.post("/api/chat", async (c) => {
  // FAST parse
  const raw = await c.req.text();
  const { image, message } = JSON.parse(raw);

  if (!image) {
    return c.json({ error: "No image provided." }, 400);
  }

  client.apiKey = c.env.OPENAI_API_KEY;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: message },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`, // must keep prefix
              },
            },
          ],
        },
      ],
    });

    return c.json({
      reply: response.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

const client = new OpenAI();
const app = new Hono();

app.use("*", cors());

app.post("/api/chat", async (c) => {
  const raw = await c.req.text();
  const { image, message } = JSON.parse(raw);

  if (!image) {
    return c.json({ error: "No image provided." }, 400);
  }

  client.apiKey = c.env.OPENAI_API_KEY;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: message },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`, 
              },
            },
          ],
        },
      ],
    });

    return c.json({
      reply: response.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
