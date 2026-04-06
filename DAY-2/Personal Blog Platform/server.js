const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve frontend files from this folder.
app.use(express.static(__dirname));

// Temporary in-memory storage (reset when server restarts).
let posts = [
  {
    id: 1,
    title: "Welcome to Personal Blog Platform",
    content:
      "This is your first post. Use Create Post page to add your own blog content and see it here.",
    author: "Admin",
    createdAt: new Date().toISOString()
  }
];

let nextId = 2;

app.get("/posts", (req, res) => {
  res.json(posts);
});

app.post("/posts", (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    return res.status(400).json({ message: "Title, content, and author are required." });
  }

  const newPost = {
    id: nextId++,
    title: title.trim(),
    content: content.trim(),
    author: author.trim(),
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);
  res.status(201).json(newPost);
});

app.get("/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((item) => item.id === id);

  if (!post) {
    return res.status(404).json({ message: "Post not found." });
  }

  res.json(post);
});

// Optional endpoint for edit support.
app.put("/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, content, author } = req.body;
  const index = posts.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Post not found." });
  }

  if (!title || !content || !author) {
    return res.status(400).json({ message: "Title, content, and author are required." });
  }

  posts[index] = {
    ...posts[index],
    title: title.trim(),
    content: content.trim(),
    author: author.trim()
  };

  res.json(posts[index]);
});

app.delete("/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = posts.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Post not found." });
  }

  const deleted = posts.splice(index, 1)[0];
  res.json({ message: "Post deleted successfully.", post: deleted });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
