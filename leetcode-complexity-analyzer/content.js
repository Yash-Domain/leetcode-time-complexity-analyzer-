console.log("✅ LeetCode Analyzer content script loaded");

let highlightedElements = [];

/* ---------------- MESSAGE LISTENER ---------------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 Received in content.js:", msg);

  if (msg.type === "GET_CODE") {
    const editor = document.querySelector(".monaco-editor");
    const textarea = editor?.querySelector("textarea");

    if (!textarea || !textarea.value) {
      sendResponse({ error: "Code not found" });
      return;
    }

    sendResponse({ code: textarea.value });
    return true;
  }

  if (msg.type === "HIGHLIGHT_LINES") {
    highlightLinesDOM(msg.lines);
  }

  if (msg.type === "CLEAR_HIGHLIGHTS") {
    clearHighlightsDOM();
  }
});

/* ---------------- DOM HIGHLIGHTING ---------------- */

function clearHighlightsDOM() {
  highlightedElements.forEach(el =>
    el.classList.remove("leetcode-dom-highlight")
  );
  highlightedElements = [];
}

function highlightLinesDOM(lines) {
  clearHighlightsDOM();

  const editor = document.querySelector(".monaco-editor");
  if (!editor) {
    console.warn("❌ Monaco editor not found");
    return;
  }

  const viewLines = Array.from(editor.querySelectorAll(".view-line"));
  if (viewLines.length === 0) return;

  // Find first loop visually
  let firstLoopIndex = -1;
  for (let i = 0; i < viewLines.length; i++) {
    const text = viewLines[i].innerText || "";
    if (text.includes("for (") || text.includes("while (")) {
      firstLoopIndex = i;
      break;
    }
  }

  lines.forEach(lineNumber => {
    let idx = lineNumber - 1;

    // Do not highlight above first loop
    if (firstLoopIndex !== -1 && idx < firstLoopIndex) {
      idx = firstLoopIndex;
    }

    const lineEl = viewLines[idx];
    if (lineEl) {
      lineEl.classList.add("leetcode-dom-highlight");
      highlightedElements.push(lineEl);
    }
  });

  console.log("✅ DOM highlight applied:", lines);
}
