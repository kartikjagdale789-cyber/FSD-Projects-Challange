const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const VOTES_FILE = path.join(__dirname, 'votes.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load voting data from votes.json.
function readVotingData() {
  if (!fs.existsSync(VOTES_FILE)) {
    return {
      candidates: [],
      votes: {},
      votedUsers: []
    };
  }

  const rawData = fs.readFileSync(VOTES_FILE, 'utf-8');

  if (!rawData.trim()) {
    return {
      candidates: [],
      votes: {},
      votedUsers: []
    };
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Could not parse votes.json:', error.message);
    return {
      candidates: [],
      votes: {},
      votedUsers: []
    };
  }
}

// Save voting data to votes.json.
function writeVotingData(data) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2));
}

// GET: Return candidates and vote counts.
app.get('/api/votes', (req, res) => {
  const data = readVotingData();
  res.json({
    candidates: data.candidates,
    votes: data.votes
  });
});

// POST: Submit one vote per user (basic validation).
app.post('/api/vote', (req, res) => {
  const { username, candidate } = req.body;

  if (!username || !candidate) {
    return res.status(400).json({ error: 'Username and candidate are required.' });
  }

  const cleanUsername = username.toString().trim().toLowerCase();
  const cleanCandidate = candidate.toString().trim();

  if (!cleanUsername || !cleanCandidate) {
    return res.status(400).json({ error: 'Username and candidate cannot be empty.' });
  }

  const data = readVotingData();

  if (!data.candidates.includes(cleanCandidate)) {
    return res.status(400).json({ error: 'Invalid candidate selected.' });
  }

  if (data.votedUsers.includes(cleanUsername)) {
    return res.status(409).json({ error: 'This user has already voted.' });
  }

  if (typeof data.votes[cleanCandidate] !== 'number') {
    data.votes[cleanCandidate] = 0;
  }

  data.votes[cleanCandidate] += 1;
  data.votedUsers.push(cleanUsername);
  writeVotingData(data);

  res.status(201).json({ message: 'Vote recorded successfully.' });
});

app.listen(PORT, () => {
  console.log(`Online Voting server running at http://localhost:${PORT}`);
});
