/* =====================================
   Online Notes Manager - JavaScript
   Beginner-friendly + commented code
   ===================================== */

// Set this to true if you want to use Node/Express API instead of localStorage.
const USE_BACKEND = false;
const API_BASE_URL = "http://localhost:3000";

const STORAGE_KEY = "online_notes_manager_notes";

/* -----------------------
   Utility + Theme Helpers
------------------------ */

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("online_notes_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  if (!toggleBtn) return;

  applySavedTheme();
  updateThemeToggleText(toggleBtn);

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("online_notes_theme", isDark ? "dark" : "light");
    updateThemeToggleText(toggleBtn);
  });
}

function updateThemeToggleText(button) {
  const isDark = document.body.classList.contains("dark");
  button.textContent = isDark ? "Light Mode" : "Dark Mode";
}

/* -----------------------
   Data Layer (local/API)
------------------------ */

function getLocalNotes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setLocalNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

async function getAllNotes() {
  if (!USE_BACKEND) return getLocalNotes();

  const res = await fetch(`${API_BASE_URL}/notes`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

async function addNewNote(note) {
  if (!USE_BACKEND) {
    const notes = getLocalNotes();
    notes.unshift(note);
    setLocalNotes(notes);
    return note;
  }

  const res = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

async function updateNote(id, updates) {
  if (!USE_BACKEND) {
    const notes = getLocalNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) throw new Error("Note not found");
    notes[index] = { ...notes[index], ...updates };
    setLocalNotes(notes);
    return notes[index];
  }

  const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

async function deleteNote(id) {
  if (!USE_BACKEND) {
    const notes = getLocalNotes().filter((n) => n.id !== id);
    setLocalNotes(notes);
    return;
  }

  const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}

async function findNoteById(id) {
  const notes = await getAllNotes();
  return notes.find((note) => note.id === id);
}

/* -----------------------
   Home Page Logic
------------------------ */

async function initHomePage() {
  const notesContainer = document.getElementById("notesContainer");
  if (!notesContainer) return;

  const searchInput = document.getElementById("searchInput");
  const dateFilter = document.getElementById("dateFilter");

  let allNotes = await getAllNotes();

  function getFilteredNotes() {
    const searchTerm = (searchInput?.value || "").toLowerCase().trim();
    const selectedDate = dateFilter?.value || "";

    const filtered = allNotes.filter((note) => {
      const text = `${note.title} ${note.content}`.toLowerCase();
      const matchesSearch = text.includes(searchTerm);
      const matchesDate = !selectedDate || note.date === selectedDate;
      return matchesSearch && matchesDate;
    });

    // Pinned notes come first.
    return filtered.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }

  function renderNotes() {
    const notes = getFilteredNotes();

    if (!notes.length) {
      notesContainer.innerHTML = `
        <div class="empty-state">
          <p>No notes found. Try creating one from Add Note page.</p>
        </div>
      `;
      return;
    }

    notesContainer.innerHTML = notes
      .map(
        (note) => `
          <article class="note-card ${note.pinned ? "pinned" : ""}">
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            <p class="note-content">${escapeHtml(note.content)}</p>
            <div class="note-date">Date: ${note.date || formatDate(note.createdAt)}</div>
            <div class="note-actions">
              <button class="btn ${note.pinned ? "btn-success" : ""}" data-action="pin" data-id="${note.id}">
                ${note.pinned ? "Unpin" : "Pin"}
              </button>
              <a class="btn" href="edit.html?id=${note.id}">Edit</a>
              <button class="btn btn-danger" data-action="delete" data-id="${note.id}">Delete</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  async function refreshNotes() {
    allNotes = await getAllNotes();
    renderNotes();
  }

  notesContainer.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    const noteId = target.dataset.id;
    if (!action || !noteId) return;

    if (action === "delete") {
      const sure = confirm("Are you sure you want to delete this note?");
      if (!sure) return;
      await deleteNote(noteId);
      await refreshNotes();
    }

    if (action === "pin") {
      const note = allNotes.find((n) => n.id === noteId);
      if (!note) return;
      await updateNote(noteId, { pinned: !note.pinned });
      await refreshNotes();
    }
  });

  searchInput?.addEventListener("input", renderNotes);
  dateFilter?.addEventListener("change", renderNotes);

  renderNotes();
}

/* -----------------------
   Add Page Logic
------------------------ */

function initAddPage() {
  const form = document.getElementById("addNoteForm");
  if (!form) return;

  const titleInput = document.getElementById("title");
  const contentInput = document.getElementById("content");
  const dateInput = document.getElementById("date");
  const errorBox = document.getElementById("formError");
  const charCounter = document.getElementById("charCounter");

  // Default date to today.
  dateInput.value = new Date().toISOString().split("T")[0];

  contentInput.addEventListener("input", () => {
    const length = contentInput.value.length;
    charCounter.textContent = `${length} characters`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const date = dateInput.value;

    if (!title || !content) {
      errorBox.textContent = "Title and content cannot be empty.";
      return;
    }

    const newNote = {
      id: crypto.randomUUID(),
      title,
      content,
      date,
      pinned: false,
      createdAt: new Date().toISOString()
    };

    try {
      await addNewNote(newNote);
      window.location.href = "index.html";
    } catch (error) {
      errorBox.textContent = "Could not save note. Please try again.";
      console.error(error);
    }
  });
}

/* -----------------------
   Edit Page Logic
------------------------ */

async function initEditPage() {
  const form = document.getElementById("editNoteForm");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const noteId = params.get("id");

  const titleInput = document.getElementById("title");
  const contentInput = document.getElementById("content");
  const dateInput = document.getElementById("date");
  const errorBox = document.getElementById("formError");
  const charCounter = document.getElementById("charCounter");

  if (!noteId) {
    errorBox.textContent = "Invalid note ID.";
    form.style.display = "none";
    return;
  }

  const note = await findNoteById(noteId);

  if (!note) {
    errorBox.textContent = "Note not found.";
    form.style.display = "none";
    return;
  }

  titleInput.value = note.title;
  contentInput.value = note.content;
  dateInput.value = note.date || new Date().toISOString().split("T")[0];
  charCounter.textContent = `${contentInput.value.length} characters`;

  contentInput.addEventListener("input", () => {
    charCounter.textContent = `${contentInput.value.length} characters`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const date = dateInput.value;

    if (!title || !content) {
      errorBox.textContent = "Title and content cannot be empty.";
      return;
    }

    try {
      await updateNote(noteId, { title, content, date });
      window.location.href = "index.html";
    } catch (error) {
      errorBox.textContent = "Could not update note. Please try again.";
      console.error(error);
    }
  });
}

/* -----------------------
   Small Security Helper
------------------------ */

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -----------------------
   Bootstrapping
------------------------ */

document.addEventListener("DOMContentLoaded", async () => {
  setupThemeToggle();

  try {
    await initHomePage();
    initAddPage();
    await initEditPage();
  } catch (error) {
    console.error("Initialization error:", error);
  }
});
