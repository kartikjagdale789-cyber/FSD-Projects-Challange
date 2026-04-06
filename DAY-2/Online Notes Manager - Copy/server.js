/* =====================================
   Online Notes Manager - Optional Backend
   Node.js + Express CRUD API
   ===================================== */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory notes array for learning purpose.
// For real projects, use a database.
let notes = [];

// GET /notes -> get all notes
app.get("/notes", (req, res) => {
  res.json(notes);
});

// POST /notes -> add new note
app.post("/notes", (req, res) => {
  const { id, title, content, date, pinned, createdAt } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  const note = {
    id: id || String(Date.now()),
    title,
    content,
    date: date || new Date().toISOString().split("T")[0],
    pinned: Boolean(pinned),
    createdAt: createdAt || new Date().toISOString()
  };

  notes.unshift(note);
  res.status(201).json(note);
});

// PUT /notes/:id -> update note
app.put("/notes/:id", (req, res) => {
  const { id } = req.params;
  const index = notes.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Note not found." });
  }

  const current = notes[index];
  const updated = {
    ...current,
    ...req.body,
    id: current.id // Keep original id fixed.
  };

  if (!updated.title || !updated.content) {
    return res.status(400).json({ message: "Title and content cannot be empty." });
  }

  notes[index] = updated;
  res.json(updated);
});

// DELETE /notes/:id -> delete note
app.delete("/notes/:id", (req, res) => {
  const { id } = req.params;
  const index = notes.findIndex((n) => n.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Note not found." });
  }

  notes.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
