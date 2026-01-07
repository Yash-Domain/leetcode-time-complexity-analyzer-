function getLeetCodeProblemSlug() {
  const match = window.location.pathname.match(/problems\/([^/]+)/);
  return match ? match[1] : null;
}

console.log("✅ LeetCode Analyzer content script loaded");

let highlightedElements = [];
let observerStarted = false;

/* ---------------- SAFE CODE GETTER ---------------- */

function getEditorCodeSafely(maxRetries = 10, delay = 50) {
  return new Promise((resolve) => {
    let attempts = 0;

    const tryRead = () => {
      const textarea =
        document.querySelector(".monaco-editor textarea") ||
        document.querySelector("textarea");

      const code = textarea?.value?.trim();

      if (code && code.length > 0) {
        resolve(code);
        return;
      }

      attempts++;
      if (attempts >= maxRetries) {
        resolve(null);
        return;
      }

      setTimeout(tryRead, delay);
    };

    tryRead();
  });
}

/* ---------------- MESSAGE LISTENER ---------------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 content.js received:", msg.type);

  if (msg.type === "GET_CODE") {
    getEditorCodeSafely().then(code => {
      if (!code) {
        sendResponse({ error: "Code not ready" });
        return;
      }

      sendResponse({
        code,
        problem_slug: getLeetCodeProblemSlug()
      });
    });

    return true; // async response
  }

  if (msg.type === "HIGHLIGHT_CODE") {
    // Defer DOM work to avoid Monaco timing issues
    setTimeout(() => highlightByCode(msg.lines), 0);
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

/* -------- FUZZY MATCH HELPERS -------- */

function tokenize(line) {
  return line.split(/[^a-zA-Z0-9_]+/).filter(Boolean);
}

function lineSimilarity(a, b) {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.length === 0 || B.length === 0) return 0;

  const setB = new Set(B);
  let common = 0;

  for (const tok of A) {
    if (setB.has(tok)) common++;
  }

  return common / Math.max(A.length, B.length);
}

function blockSimilarity(editorLines, codeLines, startIdx) {
  let score = 0;

  for (let i = 0; i < codeLines.length; i++) {
    score += lineSimilarity(
      editorLines[startIdx + i].text,
      codeLines[i]
    );
  }

  return score / codeLines.length;
}

/* -------- ROBUST HIGHLIGHT -------- */

function highlightByCode(bottleneckCode) {
  clearHighlights();

  if (!Array.isArray(bottleneckCode) || bottleneckCode.length === 0) {
    return;
  }

  const editor = document.querySelector(".monaco-editor");
  if (!editor) return;

  const editorLines = Array.from(
    editor.querySelectorAll(".view-line")
  ).map(el => ({
    element: el,
    text: normalize(el.innerText || "")
  }));

  const codeLines = bottleneckCode
    .map(normalize)
    .filter(Boolean);

  if (editorLines.length < codeLines.length) return;

  let bestMatch = { score: 0, start: -1 };

  for (let i = 0; i <= editorLines.length - codeLines.length; i++) {
    const score = blockSimilarity(editorLines, codeLines, i);

    console.log(
      `[FUZZY] window start=${i}, score=${score.toFixed(3)}`
    );

    if (score > bestMatch.score) {
      bestMatch = { score, start: i };
    }
  }

  const THRESHOLD = 0.6;

  if (bestMatch.start !== -1 && bestMatch.score >= THRESHOLD) {
    for (let i = 0; i < codeLines.length; i++) {
      const el = editorLines[bestMatch.start + i].element;
      el.classList.add("leetcode-dom-highlight");
      highlightedElements.push(el);
    }

    console.log("✅ Highlighted bottleneck block:", bestMatch);
  } else {
    console.warn("⚠️ No confident match found:", bestMatch);
  }
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
window.addEventListener("beforeunload", clearHighlights);

/* ---------------- CLEAR ON USER INTERACTION ---------------- */

document.addEventListener(
  "pointerdown",
  (e) => {
    if (
      highlightedElements.length > 0 &&
      e.target.closest(".monaco-editor")
    ) {
      clearHighlights();
      console.log("🧹 Highlights cleared due to editor click (pointerdown)");
    }
  },
  true
);

document.addEventListener(
  "keydown",
  (e) => {
    if (
      highlightedElements.length > 0 &&
      e.target.closest(".monaco-editor")
    ) {
      clearHighlights();
      console.log("🧹 Highlights cleared due to editor keydown");
    }
  },
  true
);
