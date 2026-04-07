/* =====================================
   Contact Management System - server.js
   Optional Node.js + Express backend
   ===================================== */

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory storage for beginner demo.
let contacts = [];

// GET /contacts -> get all contacts
app.get("/contacts", (req, res) => {
  res.json(contacts);
});

// POST /contacts -> add contact
app.post("/contacts", (req, res) => {
  const { id, name, phone, email, address = "", image = "", favorite = false } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ message: "Name, phone and email are required." });
  }

  const contact = {
    id: id || String(Date.now()),
    name,
    phone,
    email,
    address,
    image,
    favorite: Boolean(favorite)
  };

  contacts.unshift(contact);
  res.status(201).json(contact);
});

// PUT /contacts/:id -> update contact
app.put("/contacts/:id", (req, res) => {
  const { id } = req.params;
  const index = contacts.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Contact not found." });
  }

  contacts[index] = {
    ...contacts[index],
    ...req.body,
    id: contacts[index].id // Keep original id unchanged.
  };

  res.json(contacts[index]);
});

// DELETE /contacts/:id -> delete contact
app.delete("/contacts/:id", (req, res) => {
  const { id } = req.params;
  const index = contacts.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Contact not found." });
  }

  contacts.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
