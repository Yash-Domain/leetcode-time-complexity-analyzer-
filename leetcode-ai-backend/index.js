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
  "bottleneck_code": string[],
  "suggestions": string[]
}

Rules:
- time_complexity must be Big-O
- space_complexity must be Big-O
- bottleneck_lines must be 1-based
- bottleneck_code must contain the EXACT lines copied verbatim from the input code where the main time complexity bottleneck occurs
- Do NOT paraphrase bottleneck_code
- Preserve spacing and symbols exactly as in input
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
        content = content
          .replace(/```json/i, "")
          .replace(/```/g, "")
          .trim();

        parsed = JSON.parse(content);

        /* 🔧 MINIMAL NORMALIZATION STARTS HERE */

        if (Array.isArray(parsed.bottleneck_lines)) {
          const totalLines = code.split("\n").length;

          const region = new Set();

          parsed.bottleneck_lines.forEach((line) => {
            if (typeof line === "number") {
              // expand to small region: line-1, line, line+1
              for (let l = line - 1; l <= line + 1; l++) {
                if (l >= 1 && l <= totalLines) {
                  region.add(l);
                }
              }
            }
          });

          parsed.bottleneck_lines = Array.from(region).sort((a, b) => a - b);
        }

        /* 🔧 MINIMAL NORMALIZATION ENDS HERE */
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
