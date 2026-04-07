const applicationForm = document.getElementById('application-form');
const applicationsList = document.getElementById('applications-list');

// Fetch all applications from backend.
async function getApplications() {
  const response = await fetch('/api/applications');
  return response.json();
}

// Show applications in simple admin cards.
function renderApplications(applications) {
  applicationsList.innerHTML = '';

  if (applications.length === 0) {
    applicationsList.innerHTML = '<p class="empty-text">No applications yet.</p>';
    return;
  }

  applications.forEach((application) => {
    const card = document.createElement('article');
    card.className = 'application-card';

    card.innerHTML = `
      <h3>${application.name}</h3>
      <p><strong>Email:</strong> ${application.email}</p>
      <p><strong>Resume:</strong> <a href="${application.resumeLink}" target="_blank" rel="noopener noreferrer">Open Resume</a></p>
      <button class="delete-btn" data-id="${application.id}">Delete</button>
    `;

    applicationsList.appendChild(card);
  });
}

// Load and render all applications.
async function refreshApplications() {
  const applications = await getApplications();
  renderApplications(applications);
}

// Submit job application form.
applicationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(applicationForm);
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    resumeLink: formData.get('resumeLink')
  };

  const response = await fetch('/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to submit application.');
    return;
  }

  applicationForm.reset();
  refreshApplications();
});

// Delete application from admin view.
applicationsList.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('delete-btn')) {
    return;
  }

  const applicationId = event.target.dataset.id;

  const response = await fetch(`/api/applications/${applicationId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Failed to delete application.');
    return;
  }

  refreshApplications();
});

refreshApplications();
