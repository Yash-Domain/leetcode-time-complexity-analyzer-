console.log("✅ LeetCode Analyzer content script loaded");

let highlightedElements = [];
let observerStarted = false;

/* ---------------- MESSAGE LISTENER ---------------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 content.js received:", msg.type);

  if (msg.type === "GET_CODE") {
    const textarea =
      document.querySelector(".monaco-editor textarea") ||
      document.querySelector("textarea");

    if (!textarea || !textarea.value) {
      sendResponse({ error: "Code not found" });
      return;
    }

    sendResponse({ code: textarea.value });
    return true;
  }

  if (msg.type === "HIGHLIGHT_CODE") {
    highlightByCode(msg.lines);
  }

  if (msg.type === "CLEAR_HIGHLIGHTS") {
    clearHighlights();
  }
});

/* ---------------- HIGHLIGHT LOGIC ---------------- */

function clearHighlights() {
  highlightedElements.forEach(el =>
    el.classList.remove("leetcode-dom-highlight")
  );
  highlightedElements = [];
}

function normalize(str) {
  return str.replace(/\s+/g, " ").trim();
}

function highlightByCode(bottleneckCode) {
  clearHighlights();

  if (!Array.isArray(bottleneckCode) || bottleneckCode.length === 0) {
    return;
  }

  const editor = document.querySelector(".monaco-editor");
  if (!editor) return;

  const viewLines = Array.from(editor.querySelectorAll(".view-line"));
  const normalizedTargets = bottleneckCode.map(normalize);

  viewLines.forEach(lineEl => {
    const text = normalize(lineEl.innerText || "");

    if (normalizedTargets.some(target => text.includes(target))) {
      lineEl.classList.add("leetcode-dom-highlight");
      highlightedElements.push(lineEl);
    }
  });

  console.log("✅ Highlighted bottleneck_code:", bottleneckCode);
}

/* ---------------- AUTO-CLEAR ON EDIT ---------------- */

function observeEditorChanges() {
  if (observerStarted) return;

  const editor = document.querySelector(".monaco-editor");
  if (!editor) return;

  const observer = new MutationObserver(() => {
    if (highlightedElements.length > 0) {
      clearHighlights();
      console.log("🧹 Highlights cleared due to editor change");
    }
  });

  observer.observe(editor, {
    childList: true,
    subtree: true,
    characterData: true
  });

  observerStarted = true;
}

/* ---------------- START OBSERVER ---------------- */

observeEditorChanges();
