const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const APPLICATIONS_FILE = path.join(__dirname, 'applications.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read all applications from JSON file.
function readApplications() {
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    return [];
  }

  const rawData = fs.readFileSync(APPLICATIONS_FILE, 'utf-8');

  if (!rawData.trim()) {
    return [];
  }

  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Could not parse applications.json:', error.message);
    return [];
  }
}

// Save applications back to JSON file.
function writeApplications(applications) {
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2));
}

// GET: Return all applications (admin view).
app.get('/api/applications', (req, res) => {
  const applications = readApplications();
  res.json(applications);
});

// POST: Submit a new job application.
app.post('/api/applications', (req, res) => {
  const { name, email, resumeLink } = req.body;

  if (!name || !email || !resumeLink) {
    return res.status(400).json({ error: 'Name, email, and resume link are required.' });
  }

  const cleanName = name.toString().trim();
  const cleanEmail = email.toString().trim();
  const cleanResumeLink = resumeLink.toString().trim();

  if (!cleanName || !cleanEmail || !cleanResumeLink) {
    return res.status(400).json({ error: 'All fields must be filled.' });
  }

  const applications = readApplications();

  const newApplication = {
    id: Date.now().toString(),
    name: cleanName,
    email: cleanEmail,
    resumeLink: cleanResumeLink,
    createdAt: new Date().toISOString()
  };

  applications.push(newApplication);
  writeApplications(applications);

  res.status(201).json(newApplication);
});

// DELETE: Remove one application by id.
app.delete('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const applications = readApplications();
  const updatedApplications = applications.filter((application) => application.id !== id);

  if (updatedApplications.length === applications.length) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  writeApplications(updatedApplications);
  res.json({ message: 'Application deleted successfully.' });
});

app.listen(PORT, () => {
  console.log(`Job Portal server running at http://localhost:${PORT}`);
});
