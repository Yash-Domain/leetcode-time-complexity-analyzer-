console.log("LeetCode Analyzer content script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_CODE") {
    const editor = document.querySelector(".monaco-editor");

    if (!editor) {
      sendResponse({ code: null });
      return;
    }

    const code = editor.innerText;
    sendResponse({ code });
  }
});