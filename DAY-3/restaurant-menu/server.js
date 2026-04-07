const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const MENU_FILE = path.join(__dirname, 'menu.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read menu items from the JSON file.
function readMenu() {
  if (!fs.existsSync(MENU_FILE)) {
    return [];
  }

  const rawData = fs.readFileSync(MENU_FILE, 'utf-8');

  if (!rawData.trim()) {
    return [];
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to parse menu.json:', error.message);
    return [];
  }
}

// Save menu items to the JSON file.
function writeMenu(menuItems) {
  fs.writeFileSync(MENU_FILE, JSON.stringify(menuItems, null, 2));
}

// GET: Return all menu items.
app.get('/api/menu', (req, res) => {
  const menuItems = readMenu();
  res.json(menuItems);
});

// POST: Add one menu item.
app.post('/api/menu', (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required.' });
  }

  const cleanName = name.toString().trim();
  const numericPrice = Number(price);

  if (!cleanName) {
    return res.status(400).json({ error: 'Item name cannot be empty.' });
  }

  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ error: 'Price must be a number greater than 0.' });
  }

  const menuItems = readMenu();
  const newItem = {
    id: Date.now().toString(),
    name: cleanName,
    price: numericPrice
  };

  menuItems.push(newItem);
  writeMenu(menuItems);

  res.status(201).json(newItem);
});

// DELETE: Remove one menu item by id.
app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const menuItems = readMenu();
  const updatedMenu = menuItems.filter((item) => item.id !== id);

  if (updatedMenu.length === menuItems.length) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  writeMenu(updatedMenu);
  res.json({ message: 'Menu item deleted successfully.' });
});

app.listen(PORT, () => {
  console.log(`Restaurant Menu server running at http://localhost:${PORT}`);
});
