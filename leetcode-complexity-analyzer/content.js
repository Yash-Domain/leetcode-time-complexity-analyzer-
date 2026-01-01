console.log("✅ LeetCode Analyzer content script loaded");

let currentDecorations = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 Received in content.js:", msg);

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

  if (msg.type === "CLEAR_HIGHLIGHTS") {
    clearHighlights();
  }

  if (msg.type === "HIGHLIGHT_LINES") {
    highlightLines(msg.lines);
  }
});

/* ---------------- FIXED HIGHLIGHT LOGIC ---------------- */

function getMonacoEditorInstance() {
  if (!window.__monaco_editor__) {
    console.warn("❌ __monaco_editor__ not found");
    return null;
  }
  return window.__monaco_editor__;
}

function clearHighlights() {
  const editor = getMonacoEditorInstance();
  if (!editor) return;

  currentDecorations = editor.deltaDecorations(currentDecorations, []);
}

function highlightLines(lines) {
  const editor = getMonacoEditorInstance();
  if (!editor) return;

  clearHighlights();

  const decorations = lines.map(line => ({
    range: new window.monaco.Range(line, 1, line, 1),
    options: {
      isWholeLine: true,
      className: "leetcode-bottleneck-line",
      glyphMarginClassName: "leetcode-bottleneck-glyph"
    }
  }));

  currentDecorations = editor.deltaDecorations([], decorations);
}
