const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalEl = document.getElementById('total');

// Fetch all expenses from the backend and display them.
async function fetchExpenses() {
  const response = await fetch('/api/expenses');
  const expenses = await response.json();
  renderExpenses(expenses);
}

// Render expense list and calculate total amount.
function renderExpenses(expenses) {
  expenseList.innerHTML = '';

  let total = 0;

  expenses.forEach((expense) => {
    total += Number(expense.amount);

    const li = document.createElement('li');
    li.className = 'expense-item';

    li.innerHTML = `
      <div class="expense-info">
        <strong>${expense.title}</strong>
        <span>$${Number(expense.amount).toFixed(2)} - ${expense.date}</span>
      </div>
      <button class="delete-btn" data-id="${expense.id}">Delete</button>
    `;

    expenseList.appendChild(li);
  });

  totalEl.textContent = `Total: $${total.toFixed(2)}`;
}

// Add a new expense by calling the backend API.
expenseForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(expenseForm);
  const newExpense = {
    title: formData.get('title'),
    amount: formData.get('amount'),
    date: formData.get('date')
  };

  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newExpense)
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to add expense.');
    return;
  }

  expenseForm.reset();
  fetchExpenses();
});

// Delete an expense using event delegation.
expenseList.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('delete-btn')) {
    return;
  }

  const expenseId = event.target.dataset.id;

  const response = await fetch(`/api/expenses/${expenseId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to delete expense.');
    return;
  }

  fetchExpenses();
});

fetchExpenses();
