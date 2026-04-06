const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let events = [
  { id: 1, name: "Frontend Workshop", dateTime: "2026-04-15T10:00:00", location: "NYC Hall", description: "Learn HTML CSS JS basics.", image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80" },
  { id: 2, name: "Design Meetup", dateTime: "2026-05-01T18:00:00", location: "SF Hub", description: "UI UX beginner meetup.", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80" }
];
let registrations = [];

app.get("/events", (req, res) => res.json(events));
app.get("/events/:id", (req, res) => {
  const event = events.find(e => e.id === Number(req.params.id));
  if (!event) return res.status(404).json({ message: "Event not found" });
  return res.json(event);
});
app.post("/register", (req, res) => {
  const { eventId, name, email, phone } = req.body;
  if (!eventId || !name || !email || !phone) return res.status(400).json({ message: "Required fields missing" });
  const event = events.find(e => e.id === Number(eventId));
  if (!event) return res.status(404).json({ message: "Event not found" });
  const item = { id: Date.now(), eventId: Number(eventId), eventName: event.name, name, email, phone };
  registrations.push(item);
  return res.status(201).json(item);
});
app.get("/registrations", (req, res) => res.json(registrations));

app.listen(PORT, () => {
  console.log(`Event app server running at http://localhost:${PORT}`);
});
