document.getElementById("analyzeBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "GET_CODE" }, (response) => {
      const resultDiv = document.getElementById("result");

      if (!response || !response.code) {
        resultDiv.innerText = "No code found. Open a LeetCode problem.";
        return;
      }

      const analysis = analyzeComplexity(response.code);
      resultDiv.innerText = analysis;
    });
  });
});


function analyzeComplexity(code) {
  // 1. Loop detection
  const forLoops = (code.match(/\bfor\s*\(/g) || []).length;
  const whileLoops = (code.match(/\bwhile\s*\(/g) || []).length;
  const totalLoops = forLoops + whileLoops;

  // 2. Nested loops (rough estimate)
  const nestedLoops = code.match(/for\s*\([^)]*\)\s*\{[^}]*for\s*\(/gs)?.length || 0;

  // 3. Recursion detection (self-call)
  const functionNames = [...code.matchAll(/\b(\w+)\s*\([^)]*\)\s*\{/g)]
    .map(m => m[1]);

  let recursion = false;
  for (const fn of functionNames) {
    const calls = code.match(new RegExp(`\\b${fn}\\s*\\(`, "g")) || [];
    if (calls.length > 1) {
      recursion = true;
      break;
    }
  }

  // 4. Space complexity clues
  const usesVector = /\bvector<|unordered_map|map|set|stack|queue/.test(code);
  const recursionStack = recursion;

  // ---- Time Complexity ----
  let time = "O(1)";
  if (nestedLoops > 0) time = "O(n²)";
  else if (totalLoops === 1) time = "O(n)";
  else if (totalLoops > 1) time = "O(n²)";
  if (recursion) time = "O(recursive)";

  // ---- Space Complexity ----
  let space = "O(1)";
  if (usesVector) space = "O(n)";
  if (recursionStack) space = "O(n) (recursion stack)";

  return `Time Complexity: ${time}\nSpace Complexity: ${space}`;
}
