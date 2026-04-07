const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const BOOKS_FILE = path.join(__dirname, 'books.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read all books from books.json.
function readBooks() {
  if (!fs.existsSync(BOOKS_FILE)) {
    return [];
  }

  const rawData = fs.readFileSync(BOOKS_FILE, 'utf-8');

  if (!rawData.trim()) {
    return [];
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Could not parse books.json:', error.message);
    return [];
  }
}

// Save books to books.json.
function writeBooks(books) {
  fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2));
}

// GET: Return all books.
app.get('/api/books', (req, res) => {
  const books = readBooks();
  res.json(books);
});

// GET: Search books by title or author.
app.get('/api/books/search', (req, res) => {
  const query = (req.query.q || '').toString().trim().toLowerCase();

  if (!query) {
    return res.json([]);
  }

  const books = readBooks();
  const filteredBooks = books.filter((book) => {
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  res.json(filteredBooks);
});

// POST: Add one book.
app.post('/api/books', (req, res) => {
  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required.' });
  }

  const cleanTitle = title.toString().trim();
  const cleanAuthor = author.toString().trim();

  if (!cleanTitle || !cleanAuthor) {
    return res.status(400).json({ error: 'Title and author cannot be empty.' });
  }

  const books = readBooks();
  const newBook = {
    id: Date.now().toString(),
    title: cleanTitle,
    author: cleanAuthor
  };

  books.push(newBook);
  writeBooks(books);

  res.status(201).json(newBook);
});

// DELETE: Remove one book by id.
app.delete('/api/books/:id', (req, res) => {
  const { id } = req.params;
  const books = readBooks();
  const updatedBooks = books.filter((book) => book.id !== id);

  if (updatedBooks.length === books.length) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  writeBooks(updatedBooks);
  res.json({ message: 'Book deleted successfully.' });
});

app.listen(PORT, () => {
  console.log(`Book Library server running at http://localhost:${PORT}`);
});
