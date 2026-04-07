const menuForm = document.getElementById('menu-form');
const menuList = document.getElementById('menu-list');

// Fetch all menu items from backend.
async function getMenuItems() {
  const response = await fetch('/api/menu');
  return response.json();
}

// Render menu items as cards.
function renderMenuItems(items) {
  menuList.innerHTML = '';

  if (items.length === 0) {
    menuList.innerHTML = '<p class="empty-text">No menu items yet.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'menu-card';

    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>Price: $${Number(item.price).toFixed(2)}</p>
      <button class="delete-btn" data-id="${item.id}">Delete</button>
    `;

    menuList.appendChild(card);
  });
}

// Load and display all menu items.
async function refreshMenu() {
  const items = await getMenuItems();
  renderMenuItems(items);
}

// Submit add item form.
menuForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(menuForm);
  const payload = {
    name: formData.get('name'),
    price: formData.get('price')
  };

  const response = await fetch('/api/menu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to add menu item.');
    return;
  }

  menuForm.reset();
  refreshMenu();
});

// Delete menu item using card button.
menuList.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('delete-btn')) {
    return;
  }

  const itemId = event.target.dataset.id;

  const response = await fetch(`/api/menu/${itemId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to delete menu item.');
    return;
  }

  refreshMenu();
});

refreshMenu();
