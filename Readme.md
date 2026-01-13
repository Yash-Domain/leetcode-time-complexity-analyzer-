# LeetCode Complexity Analyzer 🚀

A Chrome extension that analyzes **Time Complexity (TC)** and **Space Complexity (SC)** of LeetCode solutions, determines whether the solution is optimal, and highlights **DOM/code patterns** that cause unnecessary complexity.

This tool is designed for **interview preparation**, **performance awareness**, and **learning algorithmic optimization**.

---

## ✨ Features

- 📊 Automatic **Time & Space Complexity analysis**
- ✅ Determines whether the solution is **optimal**
- 💡 Provides **optimization suggestions** if not optimal
- 🖍️ **Highlights relevant DOM/code sections** responsible for higher complexity
- 🔐 **BYOK (Bring Your Own Key)** – use your own LLM API key
- ⚡ Works directly on **leetcode.com**

---

## 🧠 How It Works

1. The extension extracts the problem statement and user solution from the LeetCode page.
2. The data is sent to a lightweight backend service for analysis.
3. An LLM analyzes the algorithmic approach and estimates TC/SC.
4. If the solution is not optimal:
   - The extension explains why
   - Highlights code patterns contributing to extra complexity
5. Results are shown directly inside the LeetCode interface.

---

## 🔐 Bring Your Own Key (BYOK)

This extension **does not ship with any API keys**.

You must provide:
- Your own API key (e.g., OpenAI, compatible LLM provider)
- Model name (e.g., gpt-4, gpt-3.5, etc.)

Your key is:
- Stored locally in Chrome
- Never logged
- Never sent anywhere except the analysis request you trigger

---

## 🧩 Installation

### Chrome Web Store
> (Link will be added after approval)

### Manual Installation (Developer Mode)

1. Clone this repository
2. Open Chrome → `chrome://extensions`
3. Enable **Developer Mode**
4. Click **Load Unpacked**
5. Select the project folder

---

## 🛠️ Usage Guide

1. Open any problem on **leetcode.com**
2. Write or view a solution
3. Open the extension popup
4. Enter your API key and model name (first time only)
5. Click **Analyze**
6. View:
   - Time Complexity
   - Space Complexity
   - Optimality verdict
   - Highlighted code patterns (if applicable)

---

## ⚠️ Limitations

- Complexity analysis is **heuristic-based**, not compiler-verified
- Results may vary depending on:
  - Problem constraints
  - Language used
  - Model behavior
- This tool is meant for **learning and guidance**, not absolute proof

---

## 🔒 Privacy Policy (Summary)

- ❌ No user data is collected
- ❌ No browsing activity is tracked
- ❌ API keys are never stored on any server
- ✅ All analysis is user-initiated
- ✅ Requests go only to the user-configured LLM API

Full Privacy Policy:  
👉 (https://github.com/Yash-Domain/leetcode-time-complexity-analyzer-/blob/main/PRIVACY_POLICY.md)

---

## 📌 Future Improvements

- Support for multiple solution comparisons
- Language-specific optimization hints
- Complexity trend visualization
- Firefox & Edge support

---

## 🏷️ Disclaimer

This extension is **not affiliated with or endorsed by LeetCode**.  
LeetCode is a registered trademark of its respective owners.
