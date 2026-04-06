const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const authContainer = document.getElementById('authContainer');
const todoContainer = document.getElementById('todoContainer');

// Auth elements
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginStatus = document.getElementById('loginStatus');
const registerStatus = document.getElementById('registerStatus');

// Todo elements
const welcomeUser = document.getElementById('welcomeUser');
const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskStatus = document.getElementById('taskStatus');
const searchTask = document.getElementById('searchTask');
const tasksUl = document.getElementById('tasksUl');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');

let currentUser = localStorage.getItem('todoCurrentUser') || null;
let users = JSON.parse(localStorage.getItem('todoUsers')) || [];
let tasks = JSON.parse(localStorage.getItem('todoTasks')) || {};
let activeEditTaskId = null;

function saveData() {
    localStorage.setItem('todoUsers', JSON.stringify(users));
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

function setStatus(element, message, color = 'red') {
    element.textContent = message;
    element.style.color = color;
    setTimeout(() => element.textContent = '', 2500);
}

function switchTab(tabName) {
    if (tabName === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerFormContainer.classList.remove('hidden');
        loginFormContainer.classList.add('hidden');
    }
}

function validateAuthFields(username, password) {
    if (!username.trim() || !password) {
        return 'Username and password are required.';
    }
    if (username.length < 3 || password.length < 3) {
        return 'Username and password must be at least 3 characters.';
    }
    return null;
}

function registerUser() {
    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    const error = validateAuthFields(username, password);

    if (error) return setStatus(registerStatus, error, 'red');

    if (users.find(user => user.username === username)) {
        return setStatus(registerStatus, 'Username already exists.', 'red');
    }

    users.push({ username, password });
    tasks[username] = [];
    saveData();

    setStatus(registerStatus, 'Registration successful! Login now.', 'green');
    registerUsername.value = '';
    registerPassword.value = '';
    switchTab('login');
}

function loginUser() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    const error = validateAuthFields(username, password);

    if (error) return setStatus(loginStatus, error, 'red');

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return setStatus(loginStatus, 'Invalid credentials.', 'red');
    }

    currentUser = username;
    localStorage.setItem('todoCurrentUser', currentUser);
    loginUsername.value = '';
    loginPassword.value = '';
    openTodoDashboard();
}

function openTodoDashboard() {
    authContainer.classList.add('hidden');
    todoContainer.classList.remove('hidden');
    welcomeUser.textContent = currentUser;
    renderTasks();
}

function openAuth() {
    todoContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
}

function addTask() {
    const title = taskTitle.value.trim();
    const description = taskDesc.value.trim();

    if (!title) return setStatus(taskStatus, 'Task title cannot be empty.', 'red');

    const userTasks = tasks[currentUser] || [];
    const newTask = {
        id: Date.now().toString(),
        title,
        description,
        createdAt: new Date().toLocaleString(),
        completed: false
    };

    userTasks.unshift(newTask);
    tasks[currentUser] = userTasks;
    saveData();
    taskTitle.value = '';
    taskDesc.value = '';

    setStatus(taskStatus, 'Task added successfully.', 'green');
    renderTasks();
}

function renderTasks() {
    const query = searchTask.value.toLowerCase().trim();
    const userTasks = (tasks[currentUser] || []).filter(task => {
        const content = `${task.title} ${task.description}`.toLowerCase();
        return content.includes(query);
    });

    tasksUl.innerHTML = userTasks.length === 0
        ? '<li class="task-card"><p style="margin:0">No tasks available. Add your first task.</p></li>'
        : userTasks.map(task => `
            <li class="task-card${task.completed ? ' task-completed' : ''}">
                <div class="task-left">
                    <div class="task-title">${escapeHtml(task.title)}</n></div>
                    <div class="task-desc">${escapeHtml(task.description)}</div>
                    <div class="task-meta">Created: ${task.createdAt} ${task.completed ? '| Completed' : ''}</div>
                </div>
                <div class="task-actions">
                    <button class="btn complete-toggle" onclick="toggleComplete('${task.id}')">${task.completed ? 'Undo' : 'Complete'}</button>
                    <button class="btn edit-task" onclick="startEdit('${task.id}')">Edit</button>
                    <button class="btn delete-task" onclick="deleteTask('${task.id}')">Delete</button>
                </div>
            </li>`
        ).join('');
}

function toggleComplete(taskId) {
    const userTasks = tasks[currentUser] || [];
    const target = userTasks.find(t => t.id === taskId);
    if (!target) return;
    target.completed = !target.completed;
    saveData();
    renderTasks();
}

function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    tasks[currentUser] = (tasks[currentUser] || []).filter(t => t.id !== taskId);
    saveData();
    renderTasks();
}

function startEdit(taskId) {
    const userTasks = tasks[currentUser] || [];
    const task = userTasks.find(t => t.id === taskId);
    if (!task) return;

    activeEditTaskId = taskId;
    taskTitle.value = task.title;
    taskDesc.value = task.description;
    addTaskBtn.textContent = 'Update Task';
    setStatus(taskStatus, 'Edit and click Update Task', 'blue');
}

function completeEdit() {
    const title = taskTitle.value.trim();
    const description = taskDesc.value.trim();

    if (!title) return setStatus(taskStatus, 'Task title cannot be empty.', 'red');

    const userTasks = tasks[currentUser] || [];
    const task = userTasks.find(t => t.id === activeEditTaskId);
    if (!task) return;

    task.title = title;
    task.description = description;
    task.createdAt = `${new Date().toLocaleString()} (edited)`;

    activeEditTaskId = null;
    taskTitle.value = '';
    taskDesc.value = '';
    addTaskBtn.textContent = 'Add Task';
    saveData();
    renderTasks();
    setStatus(taskStatus, 'Task updated', 'green');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('todoCurrentUser');
    searchTask.value = '';
    taskTitle.value = '';
    taskDesc.value = '';
    addTaskBtn.textContent = 'Add Task';
    openAuth();
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('todoTheme', mode);
    themeToggle.textContent = mode === 'dark' ? '☀️' : '🌙';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));
registerBtn.addEventListener('click', registerUser);
loginBtn.addEventListener('click', loginUser);
addTaskBtn.addEventListener('click', () => activeEditTaskId ? completeEdit() : addTask());
searchTask.addEventListener('input', () => renderTasks());
logoutBtn.addEventListener('click', logout);
themeToggle.addEventListener('click', toggleTheme);

(function init() {
    const savedTheme = localStorage.getItem('todoTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀️';
    }

    if (currentUser) {
        openTodoDashboard();
    } else {
        openAuth();
    }
})();
