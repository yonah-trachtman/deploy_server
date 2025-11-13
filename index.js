require("dotenv").config();
const express = require("express");
const OpenAI = require( "openai");
const cors = require("cors");


const apiKey = process.env.OPENAI_API_KEY

const app = express();
const port = 3001;
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


app.post("/api/chat", async (req, res) => {
  const { image, message } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image provided." });
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: [
            { type: "text", text: message },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          ], }],
    });

    res.json({ reply: response.choices[0].message.content });
    console.log("Model reply:", response.choices[0].message.content);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
