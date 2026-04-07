const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let questions = [
  {
    id: 1,
    question: "Which language runs in the browser?",
    options: ["Java", "C", "Python", "JavaScript"],
    correctAnswer: 3,
    difficulty: "easy",
    category: "Web"
  },
  {
    id: 2,
    question: "What does CSS stand for?",
    options: ["Colorful Style Sheets", "Cascading Style Sheets", "Creative Style System", "Computer Style Syntax"],
    correctAnswer: 1,
    difficulty: "easy",
    category: "Web"
  }
];

app.get("/questions", (req, res) => {
  res.json(questions);
});

app.post("/questions", (req, res) => {
  const { question, options, correctAnswer } = req.body;

  if (!question || !Array.isArray(options) || options.length !== 4 || correctAnswer === undefined) {
    return res.status(400).json({ message: "Invalid question payload" });
  }

  const newQuestion = {
    ...req.body,
    id: req.body.id || Date.now()
  };

  questions.push(newQuestion);
  return res.status(201).json(newQuestion);
});

app.post("/submit", (req, res) => {
  const { questions: submittedQuestions, userAnswers } = req.body;

  if (!Array.isArray(submittedQuestions) || !Array.isArray(userAnswers)) {
    return res.status(400).json({ message: "Invalid submit payload" });
  }

  let score = 0;
  submittedQuestions.forEach((q, index) => {
    if (userAnswers[index] === q.correctAnswer) {
      score += 1;
    }
  });

  return res.json({
    score,
    total: submittedQuestions.length
  });
});

app.listen(PORT, () => {
  console.log(`Quiz app server running at http://localhost:${PORT}`);
});
