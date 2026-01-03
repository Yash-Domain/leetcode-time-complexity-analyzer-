function clearHighlightsDOM() {
  highlightedElements.forEach(el => {
    el.classList.remove("leetcode-dom-highlight");
  });
  highlightedElements = [];
}

function highlightLinesDOM(lines) {
  clearHighlightsDOM();

  const editor = document.querySelector(".monaco-editor");
  if (!editor) return;

  const viewLines = Array.from(editor.querySelectorAll(".view-line"));

  // 🔑 Find first loop line visually
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

    // ⛔ Do not highlight above first loop
    if (firstLoopIndex !== -1 && idx < firstLoopIndex) {
      idx = firstLoopIndex;
    }

    const lineEl = viewLines[idx];
    if (lineEl) {
      lineEl.classList.add("leetcode-dom-highlight");
      highlightedElements.push(lineEl);
    }
  });

  console.log("✅ DOM highlight applied (loop-aligned):", lines);
}
