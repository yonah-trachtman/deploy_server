import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";

export default {
  async fetch(request, env, ctx) {
    const app = new Hono();

    app.use('*', cors());
// 
    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    app.post("/api/chat", async (c) => {
      const body = await c.req.json();
      const { image, message } = body;

      if (!image) {
        return c.json({ error: "No image provided." }, 400);
      }

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
                  image_url: { url: `data:image/jpeg;base64,${image}` },
                },
              ],
            },
          ],
        });
        console.log("Model reply:", response.choices[0].message.content);
        return c.json({
          reply: response.choices[0].message.content,
        });
      } catch (err) {
        console.error("Error calling OpenAI API:", error);
        return c.json({ error: err.message }, 500);
      }
      
    });

    return app.fetch(request, env, ctx);
  },
};
