const STORAGE_KEYS = {
  urls: "shortenerUrls",
  theme: "shortenerTheme",
  latestCode: "latestShortCode"
};

const API_BASE = "http://localhost:3004";

document.addEventListener("DOMContentLoaded", () => {
  initializeStorage();
  setupTheme();
  initializePage();
});

function initializeStorage() {
  if (!Array.isArray(getLocal(STORAGE_KEYS.urls))) {
    setLocal(STORAGE_KEYS.urls, []);
  }
}

function setupTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const saved = getLocal(STORAGE_KEYS.theme);

  if (saved === "dark") {
    document.body.classList.add("dark");
  }

  if (!themeToggle) {
    return;
  }

  themeToggle.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Dark Mode";

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    setLocal(STORAGE_KEYS.theme, isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  });
}

function initializePage() {
  const page = document.body.dataset.page;

  if (page === "home") {
    setupHomePage();
  }

  if (page === "result") {
    setupResultPage();
  }
}

function setupHomePage() {
  const form = document.getElementById("shortenForm");
  const longUrlInput = document.getElementById("longUrl");
  const customCodeInput = document.getElementById("customCode");
  const formMessage = document.getElementById("formMessage");

  if (!form || !longUrlInput || !customCodeInput || !formMessage) {
    return;
  }

  renderUrlHistory();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.textContent = "";

    const originalUrl = longUrlInput.value.trim();
    const customCode = customCodeInput.value.trim();

    if (!isValidUrl(originalUrl)) {
      formMessage.textContent = "Please enter a valid URL (starting with http:// or https://).";
      return;
    }

    if (customCode && !/^[a-zA-Z0-9_-]{3,20}$/.test(customCode)) {
      formMessage.textContent = "Custom code must be 3-20 characters (letters, numbers, - or _).";
      return;
    }

    const response = await requestApi("/shorten", "POST", {
      originalUrl,
      customCode: customCode || null
    });

    if (!response) {
      formMessage.textContent = "Could not create short URL. Try again.";
      return;
    }

    saveUrlLocally(response);
    setLocal(STORAGE_KEYS.latestCode, response.shortCode);
    window.location.href = `result.html?code=${encodeURIComponent(response.shortCode)}`;
  });
}

function renderUrlHistory() {
  const urlList = document.getElementById("urlList");
  if (!urlList) {
    return;
  }

  fetchAndSyncUrls().then(() => {
    const items = getLocal(STORAGE_KEYS.urls) || [];

    if (!items.length) {
      urlList.innerHTML = "<p>No URLs shortened yet.</p>";
      return;
    }

    urlList.innerHTML = items
      .slice()
      .reverse()
      .map((item) => {
        const shortUrl = `${API_BASE}/${item.shortCode}`;
        return `
          <article class="url-item">
            <p><strong>Original:</strong> ${item.originalUrl}</p>
            <p><strong>Short:</strong> <a class="short-link" href="${shortUrl}" target="_blank" rel="noreferrer">${shortUrl}</a></p>
            <p><strong>Clicks:</strong> ${item.clicks || 0}</p>
            <button class="btn-secondary copy-btn" data-value="${shortUrl}">Copy</button>
          </article>
        `;
      })
      .join("");

    urlList.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await copyText(btn.dataset.value);
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 900);
      });
    });
  });
}

async function setupResultPage() {
  const resultCard = document.getElementById("resultCard");
  const resultFallback = document.getElementById("resultFallback");
  const originalUrlText = document.getElementById("originalUrlText");
  const shortUrlLink = document.getElementById("shortUrlLink");
  const copyBtn = document.getElementById("copyBtn");
  const copyMessage = document.getElementById("copyMessage");
  const qrImage = document.getElementById("qrImage");

  if (!resultCard || !resultFallback || !originalUrlText || !shortUrlLink || !copyBtn || !copyMessage || !qrImage) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || getLocal(STORAGE_KEYS.latestCode);

  await fetchAndSyncUrls();
  const items = getLocal(STORAGE_KEYS.urls) || [];
  const entry = items.find((item) => item.shortCode === code);

  if (!entry) {
    resultCard.classList.add("hidden");
    resultFallback.classList.remove("hidden");
    return;
  }

  resultCard.classList.remove("hidden");
  resultFallback.classList.add("hidden");

  const shortUrl = `${API_BASE}/${entry.shortCode}`;

  originalUrlText.textContent = entry.originalUrl;
  shortUrlLink.textContent = shortUrl;
  shortUrlLink.href = shortUrl;
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`;

  copyBtn.addEventListener("click", async () => {
    await copyText(shortUrl);
    copyMessage.textContent = "Short URL copied to clipboard.";
  });
}

async function fetchAndSyncUrls() {
  const serverUrls = await requestApi("/urls", "GET");
  if (Array.isArray(serverUrls)) {
    setLocal(STORAGE_KEYS.urls, serverUrls);
  }
}

function saveUrlLocally(newItem) {
  const current = getLocal(STORAGE_KEYS.urls) || [];
  const exists = current.find((item) => item.shortCode === newItem.shortCode);

  if (exists) {
    const updated = current.map((item) =>
      item.shortCode === newItem.shortCode ? newItem : item
    );
    setLocal(STORAGE_KEYS.urls, updated);
    return;
  }

  current.push(newItem);
  setLocal(STORAGE_KEYS.urls, current);
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
  }
}

async function requestApi(path, method, body = null) {
  try {
    const options = { method, headers: {} };

    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    // If backend is unavailable, frontend still keeps localStorage records.
    return null;
  }
}

function getLocal(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
