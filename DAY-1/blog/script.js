// DOM Elements
const blogForm = document.getElementById('blogForm');
const postsContainer = document.getElementById('postsContainer');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModal = document.querySelector('.close');

// Global variables
let posts = JSON.parse(localStorage.getItem('blogPosts')) || [];
let editingPostId = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    displayPosts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add new post
    blogForm.addEventListener('submit', handleAddPost);

    // Edit post modal
    closeModal.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Edit form submission
    editForm.addEventListener('submit', handleEditPost);
}

// Handle adding new post
function handleAddPost(e) {
    e.preventDefault();

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }

    const newPost = {
        id: Date.now(),
        title: title,
        content: content,
        date: new Date().toLocaleString(),
        createdAt: new Date().getTime()
    };

    posts.unshift(newPost); // Add to beginning of array
    savePosts();
    displayPosts();
    blogForm.reset();

    // Show success animation
    showSuccessMessage('Post published successfully!');
}

// Handle editing post
function handleEditPost(e) {
    e.preventDefault();

    const title = document.getElementById('editTitle').value.trim();
    const content = document.getElementById('editContent').value.trim();

    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }

    const postIndex = posts.findIndex(post => post.id === editingPostId);
    if (postIndex !== -1) {
        posts[postIndex].title = title;
        posts[postIndex].content = content;
        posts[postIndex].date = new Date().toLocaleString() + ' (edited)';

        savePosts();
        displayPosts();
        closeEditModal();

        showSuccessMessage('Post updated successfully!');
    }
}

// Display all posts
function displayPosts() {
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No posts yet</h3>
                <p>Create your first blog post above!</p>
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card" data-id="${post.id}">
            <div class="post-header">
                <div>
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <div class="post-date">${post.date}</div>
                </div>
            </div>
            <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
            <div class="post-actions">
                <button class="btn btn-small btn-edit" onclick="openEditModal(${post.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-small btn-delete" onclick="deletePost(${post.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Open edit modal
function openEditModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    editingPostId = postId;
    document.getElementById('editTitle').value = post.title;
    document.getElementById('editContent').value = post.content;

    editModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close edit modal
function closeEditModal() {
    editModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    editingPostId = null;
    editForm.reset();
}

// Delete post
function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        posts = posts.filter(post => post.id !== postId);
        savePosts();
        displayPosts();
        showSuccessMessage('Post deleted successfully!');
    }
}

// Save posts to localStorage
function savePosts() {
    localStorage.setItem('blogPosts', JSON.stringify(posts));
}

// Show success message
function showSuccessMessage(message) {
    // Remove existing message
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(messageDiv);

    // Remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => messageDiv.remove(), 300);
        }
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS animations for success messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to close modal
    if (e.key === 'Escape' && editModal.style.display === 'block') {
        closeEditModal();
    }

    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (editModal.style.display === 'block') {
            editForm.dispatchEvent(new Event('submit'));
        } else {
            blogForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Auto-save draft (optional feature)
let draftTimeout;
document.getElementById('postTitle').addEventListener('input', saveDraft);
document.getElementById('postContent').addEventListener('input', saveDraft);

function saveDraft() {
    clearTimeout(draftTimeout);
    draftTimeout = setTimeout(() => {
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;

        if (title || content) {
            const draft = { title, content, timestamp: Date.now() };
            localStorage.setItem('blogDraft', JSON.stringify(draft));
        }
    }, 1000);
}

// Load draft on page load
const draft = JSON.parse(localStorage.getItem('blogDraft'));
if (draft && (Date.now() - draft.timestamp) < 24 * 60 * 60 * 1000) { // Draft valid for 24 hours
    document.getElementById('postTitle').value = draft.title || '';
    document.getElementById('postContent').value = draft.content || '';
}

// Add loading state for better UX
function showLoading() {
    postsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading posts...</p>
        </div>
    `;
}

function hideLoading() {
    // Loading is hidden when displayPosts() is called
}

// Character counter for textarea (optional)
document.getElementById('postContent').addEventListener('input', updateCharCount);
document.getElementById('editContent').addEventListener('input', updateCharCount);

function updateCharCount(e) {
    const textarea = e.target;
    const maxLength = 2000;
    const currentLength = textarea.value.length;

    // Remove existing counter
    const existingCounter = textarea.parentNode.querySelector('.char-counter');
    if (existingCounter) {
        existingCounter.remove();
    }

    // Add new counter
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.textContent = `${currentLength}/${maxLength}`;
    counter.style.cssText = `
        text-align: right;
        font-size: 12px;
        color: ${currentLength > maxLength * 0.9 ? '#ff6b6b' : '#666'};
        margin-top: 5px;
    `;

    textarea.parentNode.appendChild(counter);

    // Prevent typing beyond limit
    if (currentLength > maxLength) {
        textarea.value = textarea.value.substring(0, maxLength);
        counter.textContent = `${maxLength}/${maxLength}`;
    }
}