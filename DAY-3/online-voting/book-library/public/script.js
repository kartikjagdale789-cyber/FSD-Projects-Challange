const bookForm = document.getElementById('book-form');
const searchInput = document.getElementById('search-input');
const bookList = document.getElementById('book-list');

// Fetch all books from backend.
async function getBooks() {
  const response = await fetch('/api/books');
  return response.json();
}

// Search books from backend by query.
async function searchBooks(query) {
  const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

// Build book cards in UI.
function renderBooks(books) {
  bookList.innerHTML = '';

  if (books.length === 0) {
    bookList.innerHTML = '<p class="empty-text">No books found.</p>';
    return;
  }

  books.forEach((book) => {
    const card = document.createElement('article');
    card.className = 'book-card';

    card.innerHTML = `
      <h3 class="book-title">${book.title}</h3>
      <p class="book-author">by ${book.author}</p>
      <button class="delete-btn" data-id="${book.id}">Delete</button>
    `;

    bookList.appendChild(card);
  });
}

// Load all books and render.
async function refreshBooks() {
  const books = await getBooks();
  renderBooks(books);
}

// Submit add book form.
bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(bookForm);
  const payload = {
    title: formData.get('title'),
    author: formData.get('author')
  };

  const response = await fetch('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to add book.');
    return;
  }

  bookForm.reset();
  refreshBooks();
});

// Handle delete button clicks.
bookList.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('delete-btn')) {
    return;
  }

  const bookId = event.target.dataset.id;

  const response = await fetch(`/api/books/${bookId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to delete book.');
    return;
  }

  refreshBooks();
});

// Search as user types. If empty, show all books.
searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();

  if (!query) {
    refreshBooks();
    return;
  }

  const filteredBooks = await searchBooks(query);
  renderBooks(filteredBooks);
});

refreshBooks();
