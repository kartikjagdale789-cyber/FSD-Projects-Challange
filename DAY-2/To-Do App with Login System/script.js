/* =====================================
   To-Do App with Login System
   Beginner-friendly JavaScript
   ===================================== */

const USE_BACKEND = false;
const API_BASE_URL = "http://localhost:3000";

const USERS_KEY = "todo_users";
const TASKS_KEY = "todo_tasks";
const SESSION_KEY = "todo_current_user";
const THEME_KEY = "todo_theme";

/* ---------- Common Helpers ---------- */

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return password.length >= 6;
}

function saveTheme(isDark) {
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  if (theme === "dark") {
    document.body.classList.add("dark");
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  loadTheme();
  updateThemeButtonText(btn);

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    saveTheme(document.body.classList.contains("dark"));
    updateThemeButtonText(btn);
  });
}

function updateThemeButtonText(btn) {
  btn.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Dark Mode";
}

/* ---------- Storage Helpers ---------- */

function getLocalUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function setLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getLocalTasks() {
  return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
}

function setLocalTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}

/* ---------- API + Local Combined ---------- */

async function signupUser(payload) {
  if (!USE_BACKEND) {
    const users = getLocalUsers();

    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error("Email already registered.");
    }

    const user = { id: crypto.randomUUID(), ...payload };
    users.push(user);
    setLocalUsers(users);
    return user;
  }

  const res = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed.");
  return data;
}

async function loginUser(email, password) {
  if (!USE_BACKEND) {
    const users = getLocalUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) throw new Error("Invalid email or password.");
    return user;
  }

  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed.");
  return data;
}

async function getTasksByUser(userId) {
  if (!USE_BACKEND) {
    return getLocalTasks().filter((t) => t.userId === userId);
  }

  const res = await fetch(`${API_BASE_URL}/tasks?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch tasks.");
  return res.json();
}

async function createTask(task) {
  if (!USE_BACKEND) {
    const tasks = getLocalTasks();
    tasks.unshift(task);
    setLocalTasks(tasks);
    return task;
  }

  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create task.");
  return data;
}

async function updateTask(taskId, updates) {
  if (!USE_BACKEND) {
    const tasks = getLocalTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error("Task not found.");

    tasks[index] = { ...tasks[index], ...updates };
    setLocalTasks(tasks);
    return tasks[index];
  }

  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update task.");
  return data;
}

async function removeTask(taskId) {
  if (!USE_BACKEND) {
    const tasks = getLocalTasks().filter((t) => t.id !== taskId);
    setLocalTasks(tasks);
    return;
  }

  const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task.");
}

/* ---------- Route Guards ---------- */

function redirectIfLoggedIn() {
  const user = getCurrentUser();
  if (user) {
    window.location.href = "dashboard.html";
  }
}

function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

/* ---------- Login Page ---------- */

function initLoginPage() {
  if (getPage() !== "login") return;
  redirectIfLoggedIn();

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!isValidEmail(email)) {
      errorBox.textContent = "Please enter a valid email address.";
      return;
    }

    if (!isValidPassword(password)) {
      errorBox.textContent = "Password must be at least 6 characters.";
      return;
    }

    try {
      const user = await loginUser(email, password);
      setCurrentUser({ id: user.id, username: user.username, email: user.email });
      showToast("Login successful!");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });
}

/* ---------- Signup Page ---------- */

function initSignupPage() {
  if (getPage() !== "signup") return;
  redirectIfLoggedIn();

  const form = document.getElementById("signupForm");
  const usernameInput = document.getElementById("signupUsername");
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const errorBox = document.getElementById("signupError");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username) {
      errorBox.textContent = "Username is required.";
      return;
    }

    if (!isValidEmail(email)) {
      errorBox.textContent = "Please enter a valid email address.";
      return;
    }

    if (!isValidPassword(password)) {
      errorBox.textContent = "Password must be at least 6 characters.";
      return;
    }

    try {
      const user = await signupUser({ username, email, password });
      setCurrentUser({ id: user.id, username: user.username, email: user.email });
      showToast("Account created successfully!");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });
}

/* ---------- Dashboard Page ---------- */

async function initDashboardPage() {
  if (getPage() !== "dashboard") return;

  const currentUser = requireLogin();
  if (!currentUser) return;

  setupThemeToggle();

  const welcomeUser = document.getElementById("welcomeUser");
  const logoutBtn = document.getElementById("logoutBtn");

  const form = document.getElementById("taskForm");
  const titleInput = document.getElementById("taskTitle");
  const dueDateInput = document.getElementById("taskDueDate");
  const priorityInput = document.getElementById("taskPriority");
  const errorBox = document.getElementById("taskError");

  const searchInput = document.getElementById("taskSearch");
  const filterInput = document.getElementById("taskFilter");

  const pendingContainer = document.getElementById("pendingTasks");
  const completedContainer = document.getElementById("completedTasks");

  let allUserTasks = await getTasksByUser(currentUser.id);

  welcomeUser.textContent = `Hi, ${currentUser.username}`;

  logoutBtn.addEventListener("click", () => {
    clearCurrentUser();
    window.location.href = "login.html";
  });

  function taskMatchesSearch(task, term) {
    return task.title.toLowerCase().includes(term);
  }

  function getFilteredTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filterValue = filterInput.value;

    return allUserTasks.filter((task) => {
      const matchesSearch = taskMatchesSearch(task, searchTerm);
      const matchesFilter =
        filterValue === "All" ||
        (filterValue === "Completed" && task.completed) ||
        (filterValue === "Pending" && !task.completed);

      return matchesSearch && matchesFilter;
    });
  }

  function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = `task-card ${task.completed ? "completed" : ""}`;

    const titleClass = task.completed ? "task-title done" : "task-title";
    const dueText = task.dueDate ? task.dueDate : "No due date";

    card.innerHTML = `
      <h4 class="${titleClass}">${escapeHtml(task.title)}</h4>
      <span class="priority ${task.priority.toLowerCase()}">${task.priority}</span>
      <p class="meta">Due: ${escapeHtml(dueText)}</p>
      <div class="task-actions">
        <button class="btn btn-success" data-action="toggle">${task.completed ? "Mark Pending" : "Mark Done"}</button>
        <button class="btn" data-action="edit">Edit</button>
        <button class="btn btn-danger" data-action="delete">Delete</button>
      </div>
    `;

    card.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const action = target.dataset.action;
      if (!action) return;

      if (action === "toggle") {
        await updateTask(task.id, { completed: !task.completed });
        await refreshTasks();
        showToast("Task status updated.");
      }

      if (action === "edit") {
        const updatedTitle = prompt("Edit task title:", task.title);
        if (!updatedTitle) return;

        const updatedPriority = prompt("Priority (High/Medium/Low):", task.priority) || task.priority;
        const safePriority = ["High", "Medium", "Low"].includes(updatedPriority) ? updatedPriority : "Medium";

        await updateTask(task.id, { title: updatedTitle.trim(), priority: safePriority });
        await refreshTasks();
        showToast("Task updated.");
      }

      if (action === "delete") {
        const confirmDelete = confirm("Delete this task?");
        if (!confirmDelete) return;

        await removeTask(task.id);
        await refreshTasks();
        showToast("Task deleted.");
      }
    });

    return card;
  }

  function renderTasks() {
    const filtered = getFilteredTasks();
    const pending = filtered.filter((t) => !t.completed);
    const completed = filtered.filter((t) => t.completed);

    pendingContainer.innerHTML = "";
    completedContainer.innerHTML = "";

    if (!pending.length) {
      pendingContainer.innerHTML = '<div class="empty-box">No pending tasks.</div>';
    } else {
      pending.forEach((task) => pendingContainer.appendChild(createTaskCard(task)));
    }

    if (!completed.length) {
      completedContainer.innerHTML = '<div class="empty-box">No completed tasks.</div>';
    } else {
      completed.forEach((task) => completedContainer.appendChild(createTaskCard(task)));
    }
  }

  async function refreshTasks() {
    allUserTasks = await getTasksByUser(currentUser.id);
    renderTasks();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    const title = titleInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    if (!title) {
      errorBox.textContent = "Task title cannot be empty.";
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      title,
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString()
    };

    try {
      await createTask(newTask);
      form.reset();
      priorityInput.value = "Medium";
      await refreshTasks();
      showToast("Task added.");
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });

  searchInput.addEventListener("input", renderTasks);
  filterInput.addEventListener("change", renderTasks);

  renderTasks();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- Boot ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  loadTheme();
  initLoginPage();
  initSignupPage();
  await initDashboardPage();
});
