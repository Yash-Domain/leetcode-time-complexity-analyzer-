console.log("✅ LeetCode Analyzer content script loaded");

let highlightedElements = [];

/* ---------------- MESSAGE LISTENER ---------------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 Received in content.js:", msg);

  if (msg.type === "HIGHLIGHT_LINES") {
    highlightLinesDOM(msg.lines);
  }

  if (msg.type === "CLEAR_HIGHLIGHTS") {
    clearHighlightsDOM();
  }

  if (msg.type === "GET_CODE") {
    try {
      const editor = document.querySelector(".monaco-editor");
      const textarea = editor?.querySelector("textarea");

      if (!textarea?.value) {
        sendResponse({ error: "Code not found" });
        return;
      }

      sendResponse({ code: textarea.value });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  }
});

/* ---------------- DOM HIGHLIGHTING ---------------- */

function clearHighlightsDOM() {
  highlightedElements.forEach(el => {
    el.classList.remove("leetcode-dom-highlight");
  });
  highlightedElements = [];
}

function highlightLinesDOM(lines) {
  clearHighlightsDOM();

  const editor = document.querySelector(".monaco-editor");
  if (!editor) {
    console.warn("❌ Monaco editor DOM not found");
    return;
  }

  // Monaco renders visible lines as .view-line
  const viewLines = editor.querySelectorAll(".view-line");

  lines.forEach(lineNumber => {
    const index = lineNumber - 1; // 1-based → 0-based
    const lineEl = viewLines[index];

    if (lineEl) {
      lineEl.classList.add("leetcode-dom-highlight");
      highlightedElements.push(lineEl);
    }
  });

  console.log("✅ DOM highlight applied:", lines);
}
