const API_URL = "http://localhost:3000/posts";
const STORAGE_KEY = "blogPosts";
const THEME_KEY = "blogTheme";

function getPage() {
  return document.body.dataset.page;
}

function setupThemeToggle() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  setToggleText(toggle);
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    setToggleText(toggle);
  });
}

function setToggleText(button) {
  button.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Dark Mode";
}

function setupMobileMenu() {
  const menuButton = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  if (!menuButton || !navLinks) return;
  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

function getLocalPosts() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalPosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function nextLocalId(posts) {
  const maxId = posts.reduce((max, post) => Math.max(max, Number(post.id) || 0), 0);
  return maxId + 1;
}

async function request(method, url = API_URL, body) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json();
}

// If backend is not running, app still works with localStorage.
async function fetchPosts() {
  try {
    const posts = await request("GET");
    saveLocalPosts(posts);
    return posts;
  } catch {
    return getLocalPosts();
  }
}

async function fetchPostById(id) {
  try {
    return await request("GET", `${API_URL}/${id}`);
  } catch {
    return getLocalPosts().find((post) => Number(post.id) === Number(id)) || null;
  }
}

async function createPost(data) {
  try {
    const created = await request("POST", API_URL, data);
    const posts = getLocalPosts();
    saveLocalPosts([created, ...posts.filter((p) => p.id !== created.id)]);
    return created;
  } catch {
    const posts = getLocalPosts();
    const newPost = {
      id: nextLocalId(posts),
      title: data.title,
      content: data.content,
      author: data.author,
      createdAt: new Date().toISOString()
    };
    saveLocalPosts([newPost, ...posts]);
    return newPost;
  }
}

async function updatePost(id, data) {
  try {
    const updated = await request("PUT", `${API_URL}/${id}`, data);
    const posts = getLocalPosts().map((post) => (Number(post.id) === Number(id) ? updated : post));
    saveLocalPosts(posts);
    return updated;
  } catch {
    const posts = getLocalPosts().map((post) =>
      Number(post.id) === Number(id) ? { ...post, ...data } : post
    );
    saveLocalPosts(posts);
    return posts.find((post) => Number(post.id) === Number(id));
  }
}

async function removePost(id) {
  try {
    await request("DELETE", `${API_URL}/${id}`);
  } catch {
    // Ignore backend errors and update local fallback data.
  }

  const posts = getLocalPosts().filter((post) => Number(post.id) !== Number(id));
  saveLocalPosts(posts);
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function validatePost(title, content, author) {
  if (!title || !content || !author) {
    return "Please fill in all fields.";
  }

  if (title.trim().length < 4) {
    return "Title should be at least 4 characters.";
  }

  if (content.trim().length < 20) {
    return "Content should be at least 20 characters.";
  }

  return "";
}

function renderHome() {
  const grid = document.getElementById("posts-grid");
  const empty = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const authorFilter = document.getElementById("author-filter");

  if (!grid || !empty || !searchInput || !authorFilter) return;

  fetchPosts().then((posts) => {
    const authors = [...new Set(posts.map((post) => post.author))].sort();
    authorFilter.innerHTML = "<option value=\"all\">All Authors</option>";
    authors.forEach((author) => {
      const option = document.createElement("option");
      option.value = author;
      option.textContent = author;
      authorFilter.appendChild(option);
    });

    const draw = () => {
      const term = searchInput.value.toLowerCase().trim();
      const selectedAuthor = authorFilter.value;

      const filtered = posts.filter((post) => {
        const matchesSearch =
          post.title.toLowerCase().includes(term) || post.content.toLowerCase().includes(term);
        const matchesAuthor = selectedAuthor === "all" || post.author === selectedAuthor;
        return matchesSearch && matchesAuthor;
      });

      grid.innerHTML = "";
      empty.classList.toggle("hidden", filtered.length > 0);

      filtered.forEach((post) => {
        const article = document.createElement("article");
        article.className = "post-card card";
        article.innerHTML = `
          <p class="post-meta">By ${post.author} . ${formatDate(post.createdAt)}</p>
          <h3 class="post-title">${escapeHtml(post.title)}</h3>
          <p class="post-excerpt">${escapeHtml(post.content.slice(0, 120))}...</p>
          <div class="post-actions">
            <a class="btn" href="post.html?id=${post.id}">Read More</a>
          </div>
        `;
        grid.appendChild(article);
      });
    };

    draw();
    searchInput.addEventListener("input", draw);
    authorFilter.addEventListener("change", draw);
  });
}

function renderCreatePage() {
  const form = document.getElementById("create-post-form");
  const message = document.getElementById("form-message");
  if (!form || !message) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const author = String(formData.get("author") || "").trim();
    const content = String(formData.get("content") || "").trim();

    const error = validatePost(title, content, author);
    if (error) {
      message.textContent = error;
      return;
    }

    await createPost({ title, content, author });
    message.textContent = "Post published successfully. Redirecting...";
    form.reset();

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  });
}

function renderPostPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const postContainer = document.getElementById("post-container");
  const editPanel = document.getElementById("edit-panel");
  const editForm = document.getElementById("edit-post-form");
  const editMessage = document.getElementById("edit-message");
  const cancelEdit = document.getElementById("cancel-edit");

  if (!id || !postContainer || !editPanel || !editForm || !editMessage || !cancelEdit) {
    return;
  }

  const openEdit = (post) => {
    editPanel.classList.remove("hidden");
    document.getElementById("edit-title").value = post.title;
    document.getElementById("edit-author").value = post.author;
    document.getElementById("edit-content").value = post.content;
  };

  const load = async () => {
    const post = await fetchPostById(id);
    if (!post) {
      postContainer.innerHTML = "<h2>Post not found.</h2><a class='btn' href='index.html'>Go Home</a>";
      return;
    }

    postContainer.innerHTML = `
      <p class="post-meta">By ${escapeHtml(post.author)} . ${formatDate(post.createdAt)}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.content)}</p>
      <div class="form-actions">
        <button id="edit-btn" class="btn" type="button">Edit</button>
        <button id="delete-btn" class="btn btn-danger" type="button">Delete</button>
        <a href="index.html" class="btn btn-secondary">Back</a>
      </div>
    `;

    document.getElementById("edit-btn").addEventListener("click", () => openEdit(post));

    document.getElementById("delete-btn").addEventListener("click", async () => {
      const confirmed = window.confirm("Are you sure you want to delete this post?");
      if (!confirmed) return;
      await removePost(id);
      window.location.href = "index.html";
    });
  };

  cancelEdit.addEventListener("click", () => {
    editPanel.classList.add("hidden");
    editMessage.textContent = "";
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("edit-title").value.trim();
    const author = document.getElementById("edit-author").value.trim();
    const content = document.getElementById("edit-content").value.trim();

    const error = validatePost(title, content, author);
    if (error) {
      editMessage.textContent = error;
      return;
    }

    await updatePost(id, { title, content, author });
    editMessage.textContent = "Post updated.";
    editPanel.classList.add("hidden");
    load();
  });

  load();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  setupMobileMenu();

  const page = getPage();
  if (page === "home") renderHome();
  if (page === "create") renderCreatePage();
  if (page === "post") renderPostPage();
});
