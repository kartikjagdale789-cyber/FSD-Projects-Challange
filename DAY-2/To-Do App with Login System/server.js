/* =====================================
   Optional Backend - Node.js + Express
   To-Do App with Login System
   ===================================== */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory data for beginner-friendly backend.
let users = [];
let tasks = [];

// POST /signup -> create user
app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const user = {
    id: String(Date.now()),
    username,
    email,
    password
  };

  users.push(user);
  res.status(201).json({ id: user.id, username: user.username, email: user.email });
});

// POST /login -> authenticate user
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({ id: user.id, username: user.username, email: user.email });
});

// GET /tasks -> get user tasks
app.get("/tasks", (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "userId query is required." });
  }

  const userTasks = tasks.filter((t) => t.userId === userId);
  res.json(userTasks);
});

// POST /tasks -> add task
app.post("/tasks", (req, res) => {
  const { userId, title, dueDate = "", priority = "Medium", completed = false } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ message: "userId and title are required." });
  }

  const task = {
    id: String(Date.now() + Math.random()),
    userId,
    title,
    dueDate,
    priority,
    completed,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  res.status(201).json(task);
});

// PUT /tasks/:id -> update task
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Task not found." });
  }

  tasks[index] = { ...tasks[index], ...req.body, id: tasks[index].id };
  res.json(tasks[index]);
});

// DELETE /tasks/:id -> delete task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Task not found." });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
