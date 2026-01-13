function getUserSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["provider", "apiKey", "model"],
      (result) => resolve(result)
    );
  });
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "__PING__" });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  }
}

console.log("🔥 popup.js loaded");

const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");
const suggestionsDiv = document.getElementById("suggestions");
const toggleBtn = document.getElementById("toggleSuggestions");

let suggestionsVisible = false;

/* ---------------- SAFE MESSAGE HELPER ---------------- */

async function sendToContent(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (err) {
    throw new Error(
      "Content script not available. Open a LeetCode problem editor page."
    );
  }
}

/* ---------------- ANALYZE CLICK ---------------- */

analyzeBtn.addEventListener("click", async () => {
  try {

    const settings = await getUserSettings();

    if (!settings.apiKey || !settings.model) {
      resultDiv.innerHTML = `
        <p style="color:#d97706;">
          ⚠️ Setup required.<br/>
          Please configure your API key in extension settings.
        </p>
      `;
      toggleBtn.style.display = "none";
      return;
    }

    resultDiv.innerHTML = "<p>Analyzing...</p>";
    suggestionsDiv.innerHTML = "";
    toggleBtn.style.display = "none";

const [tab] = await chrome.tabs.query({
  active: true,
  currentWindow: true
});

if (!tab || !tab.url?.includes("leetcode.com/problems/")) {
  throw new Error("Open a LeetCode problem editor tab.");
}



    /* 1️⃣ GET CODE FROM EDITOR (iframe-safe) */
await ensureContentScript(tab.id);

const response = await sendToContent(tab.id, {
  type: "GET_CODE"
});


    if (!response || response.error || !response.code) {
      throw new Error("Could not extract code from editor");
    }

    /* 2️⃣ SEND CODE TO BACKEND */
    const backendRes = await fetch("https://leetcode-time-complexity-analyzer.onrender.com/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "cpp",
        code: response.code,
        apiKey: settings.apiKey,
        model: settings.model
      })
    });

    const data = await backendRes.json();

    if (!backendRes.ok || data.ok === false) {
      throw new Error(data.error || data.message || "Backend failed");
    }

    /* 3️⃣ RENDER RESULT */
    renderResult(data);

    /* 4️⃣ BACKEND → DOM HIGHLIGHT */
const bottleneckCode = data.parsed_json?.bottleneck_code;

if (Array.isArray(bottleneckCode) && bottleneckCode.length > 0) {
  await sendToContent(tab.id, {
    type: "HIGHLIGHT_CODE",
    lines: bottleneckCode
  });
} else {
  await sendToContent(tab.id, {
    type: "CLEAR_HIGHLIGHTS"
  });
}


  } catch (err) {
    console.error("❌ Popup error:", err);
    resultDiv.innerHTML = `
      <p style="color:red;">
        Analysis failed: ${err.message}
      </p>
    `;
    toggleBtn.style.display = "none";
  }
});

/* ---------------- UI RENDERING ---------------- */

function renderResult(data) {
  if (!data.parsed_json) {
    resultDiv.innerHTML = `
      <p style="color:red;">Analysis unavailable</p>
    `;
    toggleBtn.style.display = "none";
    return;
  }

  const {
    time_complexity,
    space_complexity,
    is_optimal,
    suggestions
  } = data.parsed_json;

  resultDiv.innerHTML = `
    <p><strong>Time:</strong> ${time_complexity}</p>
    <p><strong>Space:</strong> ${space_complexity}</p>
    <p><strong>Optimal:</strong> ${is_optimal ? "Yes ✅" : "No ❌"}</p>
  `;

  const finalSuggestions = is_optimal
    ? ["This solution is already optimal. No improvements needed."]
    : (suggestions && suggestions.length > 0
        ? suggestions
        : ["Consider optimizing this solution."]);

  suggestionsDiv.innerHTML = `
    <ul>
      ${finalSuggestions.map(s => `<li>${s}</li>`).join("")}
    </ul>
  `;

  suggestionsDiv.style.display = "none";
  toggleBtn.textContent = "Show Suggestions";
  toggleBtn.style.display = "block";
  suggestionsVisible = false;
}

/* ---------------- SUGGESTION TOGGLE ---------------- */

toggleBtn.addEventListener("click", () => {
  suggestionsVisible = !suggestionsVisible;
  suggestionsDiv.style.display = suggestionsVisible ? "block" : "none";
  toggleBtn.textContent = suggestionsVisible
    ? "Hide Suggestions"
    : "Show Suggestions";
});
