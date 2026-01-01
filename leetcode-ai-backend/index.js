import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// ===== ENV CHECK =====
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log("ENV KEY:", OPENROUTER_API_KEY);

if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found");
  process.exit(1);
}

console.log("✅ API key detected");

// ===== ANALYZE ROUTE =====
app.post("/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required" });
    }

    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-3-27b-it:free",
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `
You are a STRICT JSON generator.

Return ONLY valid JSON.
No markdown.
No explanations.
No extra text.

Schema:
{
  "time_complexity": string,
  "space_complexity": string,
  "is_optimal": boolean,
  "bottleneck_lines": number[],
  "suggestions": string[]
}
`
            },
            {
              role: "user",
              content: `
Language: ${language || "cpp"}

Code:
${code}
`
            }
          ]
        })
      }
    );

    const raw = await aiRes.text();
    console.log("RAW AI RESPONSE:\n", raw);

    if (!raw) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    // ===== FORCE JSON PARSING =====
    let json;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");

      json = JSON.parse(match[0]);
    } catch (e) {
      console.error("❌ JSON parse failed");
      return res.status(500).json({
        error: "Invalid AI JSON",
        raw
      });
    }

    return res.json(json);

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
