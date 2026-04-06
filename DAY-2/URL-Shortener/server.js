const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let urls = [];

app.post("/shorten", (req, res) => {
  const { originalUrl, customCode } = req.body;

  if (!isValidUrl(originalUrl)) {
    return res.status(400).json({ message: "Invalid URL format" });
  }

  if (customCode && !/^[a-zA-Z0-9_-]{3,20}$/.test(customCode)) {
    return res.status(400).json({ message: "Invalid custom code" });
  }

  if (customCode && urls.some((item) => item.shortCode === customCode)) {
    return res.status(409).json({ message: "Custom code already in use" });
  }

  // Duplicate optimization: return existing short URL for same original URL.
  if (!customCode) {
    const existing = urls.find((item) => item.originalUrl === originalUrl);
    if (existing) {
      return res.json(existing);
    }
  }

  const shortCode = customCode || generateUniqueCode();

  const newUrl = {
    id: Date.now(),
    originalUrl,
    shortCode,
    clicks: 0,
    createdAt: new Date().toISOString()
  };

  urls.push(newUrl);
  return res.status(201).json(newUrl);
});

app.get("/urls", (req, res) => {
  res.json(urls);
});

app.get("/:code", (req, res) => {
  const code = req.params.code;
  const record = urls.find((item) => item.shortCode === code);

  if (!record) {
    return res.status(404).send("Short URL not found.");
  }

  record.clicks += 1;
  return res.redirect(record.originalUrl);
});

function generateUniqueCode() {
  let code = randomCode(6);

  while (urls.some((item) => item.shortCode === code)) {
    code = randomCode(6);
  }

  return code;
}

function randomCode(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";

  for (let i = 0; i < length; i += 1) {
    output += chars[Math.floor(Math.random() * chars.length)];
  }

  return output;
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`URL Shortener server running at http://localhost:${PORT}`);
});
