app.post("/api/chat", async (c) => {
  const { image, message } = await c.req.json();

  const client = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });

  const stream = await client.responses.stream({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: message },
          {
            type: "input_image",
            image_base64: image,
          },
        ],
      },
    ],
  });

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    }
  );
});
