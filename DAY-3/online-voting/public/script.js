const usernameInput = document.getElementById('username');
const candidateList = document.getElementById('candidate-list');
const resultsList = document.getElementById('results-list');
const messageEl = document.getElementById('message');

// Fetch voting data from backend.
async function getVotingData() {
  const response = await fetch('/api/votes');
  return response.json();
}

// Show candidates with vote buttons.
function renderCandidates(candidates) {
  candidateList.innerHTML = '';

  candidates.forEach((candidate) => {
    const card = document.createElement('article');
    card.className = 'candidate-card';

    card.innerHTML = `
      <h3>${candidate}</h3>
      <button data-candidate="${candidate}">Vote</button>
    `;

    candidateList.appendChild(card);
  });
}

// Show current vote results.
function renderResults(candidates, votes) {
  resultsList.innerHTML = '';

  candidates.forEach((candidate) => {
    const count = Number(votes[candidate] || 0);

    const card = document.createElement('article');
    card.className = 'result-card';
    card.innerHTML = `
      <h3>${candidate}</h3>
      <p>Total Votes: ${count}</p>
    `;

    resultsList.appendChild(card);
  });
}

// Load data and render both candidate list and result cards.
async function refreshVotingUI() {
  const data = await getVotingData();
  renderCandidates(data.candidates);
  renderResults(data.candidates, data.votes);
}

// Vote button handler with basic validation.
candidateList.addEventListener('click', async (event) => {
  if (event.target.tagName !== 'BUTTON') {
    return;
  }

  const username = usernameInput.value.trim();

  if (!username) {
    messageEl.textContent = 'Please enter a username before voting.';
    messageEl.className = 'message error';
    return;
  }

  const selectedCandidate = event.target.dataset.candidate;

  const response = await fetch('/api/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      candidate: selectedCandidate
    })
  });

  const result = await response.json();

  if (!response.ok) {
    messageEl.textContent = result.error || 'Could not record vote.';
    messageEl.className = 'message error';
    return;
  }

  messageEl.textContent = 'Vote submitted successfully.';
  messageEl.className = 'message success';
  refreshVotingUI();
});

// Poll results every 2 seconds for near real-time updates.
setInterval(async () => {
  const data = await getVotingData();
  renderResults(data.candidates, data.votes);
}, 2000);

refreshVotingUI();
