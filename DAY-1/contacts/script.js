const nameInput = document.getElementById('nameInput');
const phoneInput = document.getElementById('phoneInput');
const addContactBtn = document.getElementById('addContactBtn');
const contactsList = document.getElementById('contactsList');
const statusMsg = document.getElementById('statusMsg');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');

const editModal = document.getElementById('editModal');
const editName = document.getElementById('editName');
const editPhone = document.getElementById('editPhone');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
let activeEditId = null;

function saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

function setStatus(msg, color = 'red') {
    statusMsg.textContent = msg;
    statusMsg.style.color = color;
    setTimeout(() => { statusMsg.textContent = ''; }, 2200);
}

function clearInputs() {
    nameInput.value = '';
    phoneInput.value = '';
}

function validate(name, phone) {
    if (!name.trim() || !phone.trim()) return 'Both fields are required.';
    const phoneRegex = /^[0-9()+-\s]{7,20}$/;
    if (!phoneRegex.test(phone)) return 'Enter a valid phone number.';
    return null;
}

function addContact() {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const error = validate(name, phone);

    if (error) return setStatus(error, 'red');

    contacts.unshift({
        id: Date.now().toString(),
        name,
        phone,
        createdAt: new Date().toLocaleString(),
    });

    saveContacts();
    renderContacts();
    clearInputs();
    setStatus('Contact added successfully!', 'green');
}

function renderContacts(query = '') {
    const filter = query.toLowerCase();
    const filtered = contacts.filter(item => {
        const text = `${item.name} ${item.phone}`.toLowerCase();
        return text.includes(filter);
    });

    if (!filtered.length) {
        contactsList.innerHTML = '<li class="contact-card"><p>No contacts found.</p></li>';
        return;
    }

    contactsList.innerHTML = filtered.map(item => `
        <li class="contact-card" data-id="${item.id}">
            <div class="contact-info">
                <span class="icon">📞</span>
                <div>
                    <div class="contact-name">${escapeHtml(item.name)}</div>
                    <div class="contact-phone">${escapeHtml(item.phone)}</div>
                    <div class="contact-meta">Added: ${item.createdAt}</div>
                </div>
            </div>
            <div class="contact-actions">
                <button class="btn edit-btn" onclick="openEdit('${item.id}')">✏️</button>
                <button class="btn delete-btn" onclick="confirmDelete('${item.id}')">🗑️</button>
            </div>
        </li>
    `).join('');
}

function confirmDelete(id) {
    if (confirm('Delete this contact?')) {
        contacts = contacts.filter(item => item.id !== id);
        saveContacts();
        renderContacts(searchInput.value);
        setStatus('Contact deleted.', 'green');
    }
}

function openEdit(id) {
    const contact = contacts.find(item => item.id === id);
    if (!contact) return;

    activeEditId = id;
    editName.value = contact.name;
    editPhone.value = contact.phone;
    editModal.classList.add('visible');
}

function closeEdit() {
    activeEditId = null;
    editName.value = '';
    editPhone.value = '';
    editModal.classList.remove('visible');
}

function updateContact() {
    const name = editName.value.trim();
    const phone = editPhone.value.trim();
    const error = validate(name, phone);

    if (error) return setStatus(error, 'red');

    const contact = contacts.find(item => item.id === activeEditId);
    if (!contact) return;

    contact.name = name;
    contact.phone = phone;
    contact.updatedAt = new Date().toLocaleString();
    saveContacts();
    renderContacts(searchInput.value);
    closeEdit();
    setStatus('Contact updated.', 'green');
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('contactsTheme', mode);
    themeToggle.textContent = mode === 'dark' ? '☀️' : '🌙';
}

function escapeHtml(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
}

addContactBtn.addEventListener('click', addContact);
searchInput.addEventListener('input', (e) => renderContacts(e.target.value));
toggleTheme.addEventListener('click', toggleTheme);
cancelEdit.addEventListener('click', closeEdit);
saveEdit.addEventListener('click', updateContact);

editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEdit();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('visible')) closeEdit();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && editModal.classList.contains('visible')) updateContact();
});

(function init() {
    const savedTheme = localStorage.getItem('contactsTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀️';
    }

    renderContacts();
})();