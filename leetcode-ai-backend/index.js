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
    const { code, language, problem_slug } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code required" });
    }

    const prompt = `
You are an expert algorithm analyst.

You are analyzing a solution for the LeetCode problem:
PROBLEM: ${problem_slug}

Follow these steps STRICTLY and in order:

STEP 1:
Analyze the given ${language} code and determine its WORST-CASE
time complexity and space complexity based ONLY on the code structure.

STEP 2:
Using the LeetCode problem name, determine the KNOWN OPTIMAL
worst-case time complexity for this problem.

STEP 3:
Compare the two results.

- If the code’s time complexity MATCHES the problem’s optimal complexity:
  - Set is_optimal = true
  - Return immediately with:
    - empty bottleneck_code
    - empty suggestions

- If the code’s time complexity DOES NOT MATCH the problem’s optimal complexity:
  - Set is_optimal = false
  - Return:
    - the ACTUAL time complexity of the code
    - the ACTUAL space complexity of the code
    - the EXACT bottleneck code copied verbatim from input
    - suggestions that improve the complexity FOR THIS PROBLEM

CRITICAL RULE FOR is_optimal:

- is_optimal must be decided ONLY by comparing WORST-CASE Big-O time complexity.
- Code completeness, formatting, missing edge cases, or logical correctness
  MUST NOT affect is_optimal.
- Even if the code is incomplete or incorrect, if its worst-case time complexity
  matches the known optimal worst-case complexity, is_optimal = true.


IMPORTANT:
- Do NOT mark a solution as non-optimal if only constant-factor
  or pruning optimizations are possible.
- Do NOT invent optimizations that do not reduce worst-case Big-O.
- Do NOT add bottlenecks or suggestions when is_optimal = true.

Return your answer in STRICT JSON format only.
Do NOT use markdown.
Do NOT add explanations outside JSON.
Do NOT wrap output in code blocks.

JSON schema (must match exactly):

{
  "time_complexity": "string",
  "space_complexity": "string",
  "is_optimal": boolean,
  "bottleneck_code": string[],
  "suggestions": string[]
}


CODE:
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
          model: "kwaipilot/kat-coder-pro:free",
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

        /* 🔧 MINIMAL NORMALIZATION */

        if (parsed.is_optimal === true) {
          parsed.bottleneck_code = [];
          parsed.suggestions = [];
        }
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
