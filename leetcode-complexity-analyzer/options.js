document.addEventListener("DOMContentLoaded", () => {
  const providerSelect = document.getElementById("provider");
  const apiKeyInput = document.getElementById("apiKey");
  const modelInput = document.getElementById("model");
  const status = document.getElementById("status");
  const form = document.getElementById("settingsForm");

  /* -------- LOAD SAVED SETTINGS -------- */
  chrome.storage.sync.get(
    ["provider", "apiKey", "model"],
    (result) => {
      if (result.provider) providerSelect.value = result.provider;
      if (result.apiKey) apiKeyInput.value = result.apiKey;
      if (result.model) modelInput.value = result.model;
    }
  );

  /* -------- SAVE SETTINGS -------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const provider = providerSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const model = modelInput.value.trim();

    if (!apiKey) {
      status.textContent = "❌ API key is required";
      status.style.color = "red";
      return;
    }

    chrome.storage.sync.set(
      {
        provider,
        apiKey,
        model
      },
      () => {
        status.textContent = "✅ Settings saved successfully";
        status.style.color = "green";
      }
    );
  });
});
