import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found");
  process.exit(1);
}

console.log("✅ API key detected");

app.post("/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code required" });
    }

    const prompt = `
You are a code complexity analyzer.

Analyze the following ${language} code.

Return your answer in STRICT JSON format.
Do NOT use markdown.
Do NOT add explanations outside JSON.
Do NOT wrap response in code blocks.

JSON schema (must match exactly):

{
  "time_complexity": "string",
  "space_complexity": "string",
  "is_optimal": boolean,
  "bottleneck_lines": number[],
  "suggestions": string[]
}

Rules:
- time_complexity must be Big-O
- space_complexity must be Big-O
- bottleneck_lines must be 1-based
- suggestions empty if optimal

Code:
${code}
`;

    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-3-27b-it:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      }
    );

    const rawText = await aiRes.text();

    console.log("🔵 RAW AI RESPONSE:");
    console.log(rawText);

    let parsed = null;

    try {
      const outer = JSON.parse(rawText);
      let content = outer?.choices?.[0]?.message?.content;

      if (content) {
        // 🔥 ONLY CHANGE: strip markdown safely
        content = content
          .replace(/```json/i, "")
          .replace(/```/g, "")
          .trim();

        parsed = JSON.parse(content);
      }
    } catch (e) {
      console.warn("⚠️ JSON parse failed");
    }

    return res.status(200).json({
      ok: true,
      parsed_json: parsed,
      raw_response: rawText,
    });

  } catch (err) {
    console.error("❌ Backend crash:", err.message);
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});