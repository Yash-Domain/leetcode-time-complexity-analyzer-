import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found in .env");
  process.exit(1);
}

console.log("✅ API key detected");

app.post("/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-3-27b-it:free",
          messages: [
            {
              role: "system",
              content:
                "You are an expert in algorithm time and space complexity analysis."
            },
            {
              role: "user",
              content: `
Analyze the following ${language || "code"}.
Return:
1. Time Complexity
2. Space Complexity
3. Is it optimal?
4. Lines responsible for high complexity
5. Suggestions for improvement

Code:
${code}
`
            }
          ]
        })
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
