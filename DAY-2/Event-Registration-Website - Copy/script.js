const EVENT_KEYS = { events: "events", registrations: "registrations" };
const eventSeed = [
  { id: 1, name: "Frontend Workshop", dateTime: "2026-04-15T10:00:00", location: "NYC Hall", description: "Learn HTML CSS JS basics.", image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80" },
  { id: 2, name: "Design Meetup", dateTime: "2026-05-01T18:00:00", location: "SF Hub", description: "UI UX beginner meetup.", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80" }
];

document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  const page = document.body.dataset.page;
  if (page === "home") renderEvents();
  if (page === "details") renderEventDetails();
  if (page === "register") setupRegister();
  if (page === "admin") renderRegistrations();
});

function initStorage() {
  if (!Array.isArray(getLocal(EVENT_KEYS.events))) setLocal(EVENT_KEYS.events, eventSeed);
  if (!Array.isArray(getLocal(EVENT_KEYS.registrations))) setLocal(EVENT_KEYS.registrations, []);
}

function getLocal(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function setLocal(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function renderEvents() {
  const list = getLocal(EVENT_KEYS.events) || [];
  const box = document.getElementById("eventsContainer");
  const search = document.getElementById("searchInput");
  const draw = () => {
    const q = search.value.toLowerCase();
    box.innerHTML = "";
    list.filter(e => e.name.toLowerCase().includes(q)).forEach(e => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `<img src="${e.image}" alt="${e.name}"><h3>${e.name}</h3><p>${new Date(e.dateTime).toLocaleString()}</p><p>${e.location}</p><p>${e.description}</p><a href="event.html?id=${e.id}">View Details</a> <a href="register.html?eventId=${e.id}">Register</a>`;
      box.appendChild(card);
    });
  };
  draw();
  search.addEventListener("input", draw);
}

function renderEventDetails() {
  const id = Number(new URLSearchParams(location.search).get("id"));
  const event = (getLocal(EVENT_KEYS.events) || []).find(e => e.id === id);
  const box = document.getElementById("eventDetails");
  if (!event) { box.innerHTML = "<p>Event not found.</p>"; return; }
  box.innerHTML = `<img src="${event.image}" alt="${event.name}"><h1>${event.name}</h1><p>${new Date(event.dateTime).toLocaleString()}</p><p>${event.location}</p><p>${event.description}</p>`;
}

function setupRegister() {
  const events = getLocal(EVENT_KEYS.events) || [];
  const form = document.getElementById("registrationForm");
  const eventSelect = document.getElementById("eventSelect");
  const confirmation = document.getElementById("confirmation");
  const pre = Number(new URLSearchParams(location.search).get("eventId"));

  eventSelect.innerHTML = events.map(e => `<option value="${e.id}" ${e.id===pre?"selected":""}>${e.name}</option>`).join("");

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    clearErrors();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    let ok = true;
    if (name.length < 2) { document.getElementById("nameError").textContent = "Name required"; ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { document.getElementById("emailError").textContent = "Valid email required"; ok = false; }
    if (!/^[0-9+\-\s]{7,15}$/.test(phone)) { document.getElementById("phoneError").textContent = "Valid phone required"; ok = false; }
    if (!ok) return;

    const eventId = Number(eventSelect.value);
    const event = events.find(e => e.id === eventId);
    const regs = getLocal(EVENT_KEYS.registrations) || [];
    regs.push({ id: Date.now(), eventId, eventName: event ? event.name : "Unknown", name, email, phone });
    setLocal(EVENT_KEYS.registrations, regs);
    confirmation.classList.remove("hidden");
    confirmation.innerHTML = `<strong>Registration successful</strong><p>Thanks ${name}, you are registered for ${event ? event.name : "the event"}.</p>`;
    form.reset();
  });
}

function clearErrors() {
  ["nameError", "emailError", "phoneError"].forEach(id => document.getElementById(id).textContent = "");
}

function renderRegistrations() {
  const regs = getLocal(EVENT_KEYS.registrations) || [];
  const box = document.getElementById("registrations");
  if (!regs.length) { box.innerHTML = "<p>No registrations yet.</p>"; return; }
  box.innerHTML = regs.map(r => `<article class="card"><h3>${r.name}</h3><p>${r.email} | ${r.phone}</p><p>Event: ${r.eventName}</p></article>`).join("");
}
