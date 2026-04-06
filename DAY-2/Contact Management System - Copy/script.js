/* =====================================
   Contact Management System - script.js
   Beginner-friendly JavaScript
   ===================================== */

const USE_BACKEND = false;
const API_BASE_URL = "http://localhost:3000";

const CONTACTS_KEY = "cms_contacts";
const THEME_KEY = "cms_theme";
const PAGE_SIZE = 6;

let imageDataUrl = "";
let currentPage = 1;

/* ---------- Helpers ---------- */

function getPage() {
  return document.body.dataset.page;
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 2600);
}

function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") {
    document.body.classList.add("dark");
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  applyTheme();
  updateThemeButtonText(btn);

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    updateThemeButtonText(btn);
  });
}

function updateThemeButtonText(btn) {
  btn.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Dark Mode";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[+]?\d{7,15}$/.test(phone.replace(/\s+/g, ""));
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function defaultAvatar(name) {
  const firstLetter = (name || "U").charAt(0).toUpperCase();
  return `https://dummyimage.com/100x100/eef3ff/4f7cff&text=${encodeURIComponent(firstLetter)}`;
}

/* ---------- Data Layer ---------- */

function getLocalContacts() {
  return JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]");
}

function setLocalContacts(contacts) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

async function getContacts() {
  if (!USE_BACKEND) return getLocalContacts();

  const res = await fetch(`${API_BASE_URL}/contacts`);
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

async function addContact(contact) {
  if (!USE_BACKEND) {
    const contacts = getLocalContacts();
    contacts.unshift(contact);
    setLocalContacts(contacts);
    return contact;
  }

  const res = await fetch(`${API_BASE_URL}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add contact");
  return data;
}

async function updateContact(id, updates) {
  if (!USE_BACKEND) {
    const contacts = getLocalContacts();
    const index = contacts.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Contact not found");

    contacts[index] = { ...contacts[index], ...updates };
    setLocalContacts(contacts);
    return contacts[index];
  }

  const res = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update contact");
  return data;
}

async function deleteContact(id) {
  if (!USE_BACKEND) {
    const contacts = getLocalContacts().filter((c) => c.id !== id);
    setLocalContacts(contacts);
    return;
  }

  const res = await fetch(`${API_BASE_URL}/contacts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete contact");
}

async function getContactById(id) {
  const contacts = await getContacts();
  return contacts.find((c) => c.id === id);
}

/* ---------- Home Page ---------- */

async function initHomePage() {
  if (getPage() !== "home") return;

  const contactsContainer = document.getElementById("contactsContainer");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importInput = document.getElementById("importInput");

  let allContacts = await getContacts();

  function filterAndSortContacts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const sortOrder = sortSelect.value;

    const filtered = allContacts.filter((contact) => {
      const byName = contact.name.toLowerCase().includes(searchTerm);
      const byPhone = contact.phone.toLowerCase().includes(searchTerm);
      return byName || byPhone;
    });

    filtered.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (nameA < nameB) return sortOrder === "az" ? -1 : 1;
      if (nameA > nameB) return sortOrder === "az" ? 1 : -1;
      return 0;
    });

    // Favorites appear first.
    filtered.sort((a, b) => Number(b.favorite) - Number(a.favorite));

    return filtered;
  }

  function getPaginatedContacts(items) {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return {
      pageItems: items.slice(start, end),
      totalPages
    };
  }

  function renderContacts() {
    const filtered = filterAndSortContacts();
    const { pageItems, totalPages } = getPaginatedContacts(filtered);

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    if (!pageItems.length) {
      contactsContainer.innerHTML = '<div class="empty-box">No contacts found.</div>';
      return;
    }

    contactsContainer.innerHTML = pageItems
      .map(
        (contact) => `
          <article class="contact-card">
            <div class="contact-header">
              <img class="avatar" src="${contact.image || defaultAvatar(contact.name)}" alt="Profile" />
              <h3 class="contact-name">${escapeHtml(contact.name)}</h3>
              <button class="favorite-btn" data-action="favorite" data-id="${contact.id}" title="Favorite">
                ${contact.favorite ? "⭐" : "☆"}
              </button>
            </div>

            <p class="contact-info">📞 ${escapeHtml(contact.phone)}</p>
            <p class="contact-info">✉️ ${escapeHtml(contact.email)}</p>
            <p class="contact-info">📍 ${escapeHtml(contact.address || "No address")}</p>

            <div class="card-actions">
              <a class="btn" href="edit.html?id=${contact.id}">✏️ Edit</a>
              <button class="btn btn-danger" data-action="delete" data-id="${contact.id}">🗑️ Delete</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  async function refresh() {
    allContacts = await getContacts();
    renderContacts();
  }

  contactsContainer.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === "delete") {
      if (!confirm("Delete this contact?")) return;
      await deleteContact(id);
      showToast("Contact deleted.");
      await refresh();
    }

    if (action === "favorite") {
      const contact = allContacts.find((c) => c.id === id);
      if (!contact) return;
      await updateContact(id, { favorite: !contact.favorite });
      showToast(contact.favorite ? "Removed from favorites." : "Added to favorites.");
      await refresh();
    }
  });

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderContacts();
  });

  sortSelect.addEventListener("change", () => {
    currentPage = 1;
    renderContacts();
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderContacts();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    currentPage += 1;
    renderContacts();
  });

  exportBtn.addEventListener("click", async () => {
    const contacts = await getContacts();
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts-backup.json";
    a.click();

    URL.revokeObjectURL(url);
    showToast("Contacts exported.");
  });

  importBtn.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", async () => {
    const file = importInput.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!Array.isArray(imported)) {
        throw new Error("Invalid file format.");
      }

      // Keep required keys only for safety.
      const cleaned = imported
        .filter((c) => c && c.name && c.phone && c.email)
        .map((c) => ({
          id: c.id || crypto.randomUUID(),
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address || "",
          image: c.image || "",
          favorite: Boolean(c.favorite)
        }));

      setLocalContacts(cleaned);
      showToast("Contacts imported.");
      await refresh();
    } catch (error) {
      showToast("Failed to import JSON file.");
      console.error(error);
    }
  });

  renderContacts();
}

/* ---------- Add/Edit Page ---------- */

function setupImagePreview(fileInput, previewImage) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) {
      imageDataUrl = "";
      previewImage.classList.add("hidden");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      imageDataUrl = String(reader.result);
      previewImage.src = imageDataUrl;
      previewImage.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

function getFormValues() {
  return {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim()
  };
}

function validateForm(values) {
  if (!values.name || !values.phone || !values.email) {
    return "Name, phone and email are required.";
  }
  if (!isValidPhone(values.phone)) {
    return "Please enter a valid phone number (7 to 15 digits).";
  }
  if (!isValidEmail(values.email)) {
    return "Please enter a valid email address.";
  }
  return "";
}

async function initAddPage() {
  if (getPage() !== "add") return;

  const form = document.getElementById("contactForm");
  const errorBox = document.getElementById("formError");
  const fileInput = document.getElementById("profileImage");
  const previewImage = document.getElementById("imagePreview");

  setupImagePreview(fileInput, previewImage);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const values = getFormValues();
    const validationError = validateForm(values);
    if (validationError) {
      errorBox.textContent = validationError;
      return;
    }

    const contact = {
      id: crypto.randomUUID(),
      name: values.name,
      phone: values.phone,
      email: values.email,
      address: values.address,
      image: imageDataUrl,
      favorite: false
    };

    try {
      await addContact(contact);
      showToast("Contact added.");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });
}

async function initEditPage() {
  if (getPage() !== "edit") return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const form = document.getElementById("contactForm");
  const errorBox = document.getElementById("formError");
  const fileInput = document.getElementById("profileImage");
  const previewImage = document.getElementById("imagePreview");

  if (!id) {
    errorBox.textContent = "Invalid contact ID.";
    form.style.display = "none";
    return;
  }

  const contact = await getContactById(id);
  if (!contact) {
    errorBox.textContent = "Contact not found.";
    form.style.display = "none";
    return;
  }

  document.getElementById("name").value = contact.name;
  document.getElementById("phone").value = contact.phone;
  document.getElementById("email").value = contact.email;
  document.getElementById("address").value = contact.address || "";

  imageDataUrl = contact.image || "";
  if (imageDataUrl) {
    previewImage.src = imageDataUrl;
    previewImage.classList.remove("hidden");
  }

  setupImagePreview(fileInput, previewImage);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const values = getFormValues();
    const validationError = validateForm(values);
    if (validationError) {
      errorBox.textContent = validationError;
      return;
    }

    try {
      await updateContact(id, {
        name: values.name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        image: imageDataUrl
      });
      showToast("Contact updated.");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });
}

/* ---------- Boot ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  setupThemeToggle();
  await initHomePage();
  await initAddPage();
  await initEditPage();
});
