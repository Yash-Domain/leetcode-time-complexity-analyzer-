console.log("🔥 popup.js loaded");

const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");
const suggestionsDiv = document.getElementById("suggestions");
const toggleBtn = document.getElementById("toggleSuggestions");

let suggestionsVisible = false;

analyzeBtn.addEventListener("click", async () => {
  try {
    resultDiv.innerHTML = "<p>Analyzing...</p>";
    suggestionsDiv.innerHTML = "";
    toggleBtn.style.display = "none";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    // 1️⃣ Get code from editor
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "GET_CODE"
    });

    if (!response || response.error || !response.code) {
      throw new Error("Could not extract code from editor");
    }

    // 2️⃣ Send code to backend
    const backendRes = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "cpp",
        code: response.code
      })
    });

    const data = await backendRes.json();

    // 🚨 Explicit backend failure handling (NO masking)
    if (!backendRes.ok || data.ok === false) {
      throw new Error(data.error || data.message || "Backend failed");
    }

    // 3️⃣ Render result in popup
    renderResult(data);

    // 4️⃣ SUBSESSION 3 — Backend → DOM Highlight integration
    const bottleneckLines = data.parsed_json?.bottleneck_lines;

    if (Array.isArray(bottleneckLines) && bottleneckLines.length > 0) {
      chrome.tabs.sendMessage(tab.id, {
        type: "HIGHLIGHT_LINES",
        lines: bottleneckLines
      });
    } else {
      // Optimal or no bottlenecks → clear previous highlights
      chrome.tabs.sendMessage(tab.id, {
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
      <p style="color:red;">
        Analysis unavailable
      </p>
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
