const noteInput = document.getElementById('noteInput');
const noteTitle = document.getElementById('noteTitle');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const notesContainer = document.getElementById('notesContainer');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const editModal = document.getElementById('editModal');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

let notes = JSON.parse(localStorage.getItem('notes')) || [];
let editingNoteId = null;

function generateId() {
    return 'note-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function getNow() {
    return new Date().toLocaleString();
}

function showNotice(text) {
    const notice = document.createElement('div');
    notice.className = 'success-notice';
    notice.textContent = text;
    document.body.appendChild(notice);

    setTimeout(() => {
        notice.style.opacity = '0';
        setTimeout(() => notice.remove(), 250);
    }, 1500);
}

function renderNotes(filter='') {
    const normalizedFilter = filter.toLowerCase().trim();
    const filtered = notes.filter(note => {
        if(!normalizedFilter) return true;
        return note.title.toLowerCase().includes(normalizedFilter) || note.content.toLowerCase().includes(normalizedFilter);
    });

    if (filtered.length === 0) {
        notesContainer.innerHTML = '<div class="modal-box"><p style="text-align:center;">No notes found. Start by adding a new note!</p></div>';
        return;
    }

    notesContainer.innerHTML = filtered.map(note => `
        <div class="note-card" data-id="${note.id}">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-meta">${note.date}</div>
            <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
            <div class="note-actions">
                <button class="btn edit-btn" onclick="openEdit('${note.id}')">Edit</button>
                <button class="btn delete-btn" onclick="deleteNote('${note.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function clearFields() {
    noteInput.value = '';
    noteTitle.value = '';
}

function addNote() {
    const title = noteTitle.value.trim() || 'Untitled Note';
    const content = noteInput.value.trim();

    if (!content) {
        alert('Please write something in the note area before saving.');
        return;
    }

    const note = {
        id: generateId(),
        title,
        content,
        date: getNow(),
        updated: null
    };

    notes.unshift(note);
    saveNotes();
    renderNotes(searchInput.value);
    clearFields();
    showNotice('Note saved successfully');
}

function deleteNote(id) {
    if (!confirm('Delete this note permanently?')) return;
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes(searchInput.value);
    showNotice('Note deleted');
}

function openEdit(id) {
    const target = notes.find(note => note.id === id);
    if (!target) return;

    editingNoteId = id;
    editTitle.value = target.title;
    editContent.value = target.content;
    editModal.classList.add('visible');
}

function closeEdit() {
    editingNoteId = null;
    editModal.classList.remove('visible');
    editTitle.value = '';
    editContent.value = '';
}

function saveEditNote() {
    const title = editTitle.value.trim() || 'Untitled Note';
    const content = editContent.value.trim();

    if (!content) {
        alert('Please enter note content to update.');
        return;
    }

    const note = notes.find(note => note.id === editingNoteId);
    if (!note) return;

    note.title = title;
    note.content = content;
    note.updated = getNow();
    note.date = `${note.date.split(' (edited)')[0]} (edited)`;

    saveNotes();
    renderNotes(searchInput.value);
    closeEdit();
    showNotice('Note updated');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

saveNoteBtn.addEventListener('click', addNote);
searchInput.addEventListener('input', (event) => renderNotes(event.target.value));
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('notesTheme', isDark ? 'dark' : 'light');
});

cancelEdit.addEventListener('click', closeEdit);
saveEdit.addEventListener('click', saveEditNote);

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('visible')) {
        closeEdit();
    }
});

// Keyboard shortcuts
noteInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        addNote();
    }
});

// Load saved theme and notes
(function init() {
    const storedTheme = localStorage.getItem('notesTheme');
    if (storedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀️';
    }

    renderNotes();
})();

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('noteInput');
    const saveBtn = document.getElementById('saveNoteBtn');

    input.addEventListener('input', () => {
        if (input.value.length > 0) saveBtn.textContent = 'Save Note';
        else saveBtn.textContent = 'Add Note';
    });
});