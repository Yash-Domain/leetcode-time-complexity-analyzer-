const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");
const suggestionsDiv = document.getElementById("suggestions");
const toggleBtn = document.getElementById("toggleSuggestions");

let suggestionsVisible = false;

analyzeBtn.addEventListener("click", async () => {
  try {
    resultDiv.innerHTML = "Analyzing...";
    suggestionsDiv.innerHTML = "";
    toggleBtn.style.display = "none";

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "GET_CODE"
    });

    if (!response || response.error || !response.code) {
      throw new Error("Could not extract code");
    }

    const backendRes = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "cpp",
        code: response.code
      })
    });

      const data = await backendRes.json();

      if (!backendRes.ok || data.error) {
        throw new Error(data.error || "Backend failed");
      }

      renderResult(data);

    // 🔥 NEW — clear old highlights
    chrome.tabs.sendMessage(tab.id, {
      type: "CLEAR_HIGHLIGHTS"
    });

    // 🔥 NEW — send bottleneck lines to content.js
    if (data.bottleneck_lines && data.bottleneck_lines.length > 0) {
      chrome.tabs.sendMessage(tab.id, {
        type: "HIGHLIGHT_LINES",
        lines: data.bottleneck_lines
      });
    }

  } catch (err) {
    console.error(err);
    alert("Analysis failed. Check console.");
  }
});

function renderResult(data) {
  resultDiv.innerHTML = `
    <p><strong>Time:</strong> ${data.time_complexity}</p>
    <p><strong>Space:</strong> ${data.space_complexity}</p>
    <p><strong>Optimal:</strong> ${data.is_optimal ? "Yes ✅" : "No ❌"}</p>
  `;

  const suggestions =
    data.suggestions && data.suggestions.length > 0
      ? data.suggestions
      : ["This solution is already optimal. No improvements needed."];

  suggestionsDiv.innerHTML = `
    <ul>
      ${suggestions.map(s => `<li>${s}</li>`).join("")}
    </ul>
  `;

  suggestionsDiv.style.display = "none";
  toggleBtn.textContent = "Show Suggestions";
  toggleBtn.style.display = "block";
  suggestionsVisible = false;
}

toggleBtn.addEventListener("click", () => {
  suggestionsVisible = !suggestionsVisible;
  suggestionsDiv.style.display = suggestionsVisible ? "block" : "none";
  toggleBtn.textContent = suggestionsVisible
    ? "Hide Suggestions"
    : "Show Suggestions";
});
