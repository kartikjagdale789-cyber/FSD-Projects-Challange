const STORAGE_KEYS = {
  questions: "quizQuestions",
  userAnswers: "quizUserAnswers",
  score: "quizScore",
  quizOrder: "quizOrder",
  leaderboard: "quizLeaderboard",
  settings: "quizSettings",
  theme: "quizTheme"
};

const API_BASE = "http://localhost:3003";
const QUIZ_TIME_SECONDS = 120;

let timerInterval;

const defaultQuestions = [
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
  },
  {
    id: 3,
    question: "Which array method adds an item at the end?",
    options: ["push()", "pop()", "shift()", "map()"],
    correctAnswer: 0,
    difficulty: "medium",
    category: "JavaScript"
  },
  {
    id: 4,
    question: "Which HTML tag is used for the largest heading?",
    options: ["<h6>", "<head>", "<h1>", "<heading>"],
    correctAnswer: 2,
    difficulty: "easy",
    category: "HTML"
  },
  {
    id: 5,
    question: "Which keyword declares a block-scoped variable in JS?",
    options: ["var", "let", "const", "Both let and const"],
    correctAnswer: 3,
    difficulty: "medium",
    category: "JavaScript"
  },
  {
    id: 6,
    question: "What is the output type of Number('12')?",
    options: ["string", "number", "boolean", "object"],
    correctAnswer: 1,
    difficulty: "hard",
    category: "JavaScript"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  initializeStorage();
  setupNavigation();
  setupTheme();
  initializePage();
});

function initializeStorage() {
  if (!Array.isArray(getLocal(STORAGE_KEYS.questions)) || getLocal(STORAGE_KEYS.questions).length === 0) {
    setLocal(STORAGE_KEYS.questions, defaultQuestions);
  }

  if (!Array.isArray(getLocal(STORAGE_KEYS.userAnswers))) {
    setLocal(STORAGE_KEYS.userAnswers, []);
  }

  if (!Array.isArray(getLocal(STORAGE_KEYS.leaderboard))) {
    setLocal(STORAGE_KEYS.leaderboard, []);
  }

  if (!getLocal(STORAGE_KEYS.settings)) {
    setLocal(STORAGE_KEYS.settings, {
      randomOrder: true,
      difficulty: "all",
      category: "all",
      playerName: "Guest"
    });
  }
}

function setupNavigation() {
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");

  if (!menuBtn || !navLinks) {
    return;
  }

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

function setupTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = getLocal(STORAGE_KEYS.theme);

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }

  if (!themeToggle) {
    return;
  }

  themeToggle.textContent = document.body.classList.contains("dark") ? "Light Mode" : "Dark Mode";

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    setLocal(STORAGE_KEYS.theme, dark ? "dark" : "light");
    themeToggle.textContent = dark ? "Light Mode" : "Dark Mode";
  });
}

function initializePage() {
  const page = document.body.dataset.page;

  if (page === "home") {
    setupHomePage();
  }

  if (page === "quiz") {
    setupQuizPage();
  }

  if (page === "result") {
    setupResultPage();
  }

  if (page === "admin") {
    setupAdminPage();
  }
}

async function getQuestions() {
  const apiQuestions = await requestApi("/questions", "GET");

  if (Array.isArray(apiQuestions) && apiQuestions.length > 0) {
    setLocal(STORAGE_KEYS.questions, apiQuestions);
    return apiQuestions;
  }

  return getLocal(STORAGE_KEYS.questions) || [];
}

function setupHomePage() {
  const startBtn = document.getElementById("startQuizBtn");
  const randomOrderBtn = document.getElementById("randomOrderBtn");
  const difficultySelect = document.getElementById("difficultySelect");
  const categorySelect = document.getElementById("categorySelect");
  const playerNameInput = document.getElementById("playerName");

  if (!startBtn || !randomOrderBtn || !difficultySelect || !categorySelect || !playerNameInput) {
    return;
  }

  const settings = getLocal(STORAGE_KEYS.settings);
  difficultySelect.value = settings.difficulty;
  playerNameInput.value = settings.playerName === "Guest" ? "" : settings.playerName;

  getQuestions().then((questions) => {
    const categories = [...new Set(questions.map((q) => q.category))];
    categorySelect.innerHTML = '<option value="all">All Categories</option>' +
      categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("");
    categorySelect.value = settings.category;
  });

  updateRandomOrderButton(randomOrderBtn, settings.randomOrder);

  randomOrderBtn.addEventListener("click", () => {
    const current = getLocal(STORAGE_KEYS.settings);
    current.randomOrder = !current.randomOrder;
    setLocal(STORAGE_KEYS.settings, current);
    updateRandomOrderButton(randomOrderBtn, current.randomOrder);
  });

  startBtn.addEventListener("click", async () => {
    const allQuestions = await getQuestions();
    const current = getLocal(STORAGE_KEYS.settings);

    current.difficulty = difficultySelect.value;
    current.category = categorySelect.value;
    current.playerName = playerNameInput.value.trim() || "Guest";
    setLocal(STORAGE_KEYS.settings, current);

    let quizQuestions = [...allQuestions];

    if (current.difficulty !== "all") {
      quizQuestions = quizQuestions.filter((q) => q.difficulty === current.difficulty);
    }

    if (current.category !== "all") {
      quizQuestions = quizQuestions.filter((q) => q.category === current.category);
    }

    if (quizQuestions.length === 0) {
      alert("No questions found for selected filters.");
      return;
    }

    const orderedIds = quizQuestions.map((q) => q.id);

    if (current.randomOrder) {
      shuffleArray(orderedIds);
    }

    setLocal(STORAGE_KEYS.quizOrder, orderedIds);
    setLocal(STORAGE_KEYS.userAnswers, Array(orderedIds.length).fill(null));
    setLocal(STORAGE_KEYS.score, 0);
    setLocal("quizCurrentIndex", 0);
    setLocal("quizTimeLeft", QUIZ_TIME_SECONDS);

    window.location.href = "quiz.html";
  });

  renderLeaderboard();
}

function updateRandomOrderButton(button, isEnabled) {
  button.textContent = `Random Order: ${isEnabled ? "On" : "Off"}`;
}

function renderLeaderboard() {
  const box = document.getElementById("leaderboardContainer");
  if (!box) {
    return;
  }

  const leaderboard = getLocal(STORAGE_KEYS.leaderboard) || [];
  if (!leaderboard.length) {
    box.innerHTML = "<p class='muted'>No scores yet.</p>";
    return;
  }

  box.innerHTML = leaderboard
    .slice(0, 5)
    .map((item, idx) => `<article class='leaderboard-item'><strong>${idx + 1}. ${item.name}</strong><p>Score: ${item.score}/${item.totalQuestions}</p></article>`)
    .join("");
}

async function setupQuizPage() {
  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  const questionText = document.getElementById("questionText");
  const optionsContainer = document.getElementById("optionsContainer");
  const validationText = document.getElementById("validationText");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");
  const timerText = document.getElementById("timerText");

  if (!progressText || !progressBar || !questionText || !optionsContainer || !validationText || !prevBtn || !nextBtn || !submitBtn || !timerText) {
    return;
  }

  const allQuestions = await getQuestions();
  const order = getLocal(STORAGE_KEYS.quizOrder) || [];

  if (!order.length) {
    window.location.href = "index.html";
    return;
  }

  const quizQuestions = order
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter(Boolean);

  let currentIndex = Number(getLocal("quizCurrentIndex") || 0);
  let userAnswers = getLocal(STORAGE_KEYS.userAnswers) || Array(quizQuestions.length).fill(null);

  function renderQuestion() {
    const currentQuestion = quizQuestions[currentIndex];
    if (!currentQuestion) {
      return;
    }

    progressText.textContent = `Question ${currentIndex + 1} of ${quizQuestions.length}`;
    progressBar.style.width = `${((currentIndex + 1) / quizQuestions.length) * 100}%`;
    questionText.textContent = currentQuestion.question;

    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, optionIndex) => {
      const optionBtn = document.createElement("button");
      optionBtn.type = "button";
      optionBtn.className = "option-btn";
      optionBtn.textContent = option;

      if (userAnswers[currentIndex] === optionIndex) {
        optionBtn.classList.add("selected");
      }

      optionBtn.addEventListener("click", () => {
        userAnswers[currentIndex] = optionIndex;
        setLocal(STORAGE_KEYS.userAnswers, userAnswers);
        validationText.textContent = "";
        renderQuestion();
      });

      optionsContainer.appendChild(optionBtn);
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === quizQuestions.length - 1;
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      setLocal("quizCurrentIndex", currentIndex);
      renderQuestion();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (userAnswers[currentIndex] === null) {
      validationText.textContent = "Please select an answer before moving next.";
      return;
    }

    if (currentIndex < quizQuestions.length - 1) {
      currentIndex += 1;
      setLocal("quizCurrentIndex", currentIndex);
      renderQuestion();
    }
  });

  submitBtn.addEventListener("click", async () => {
    if (userAnswers[currentIndex] === null) {
      validationText.textContent = "Please select an answer before submitting.";
      return;
    }

    await submitQuiz(quizQuestions, userAnswers);
  });

  startTimer(timerText, async () => {
    await submitQuiz(quizQuestions, userAnswers);
  });

  renderQuestion();
}

function startTimer(timerText, onComplete) {
  let timeLeft = Number(getLocal("quizTimeLeft") || QUIZ_TIME_SECONDS);

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  const update = () => {
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const secs = (timeLeft % 60).toString().padStart(2, "0");
    timerText.textContent = `Time left: ${mins}:${secs}`;
  };

  update();

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    setLocal("quizTimeLeft", timeLeft);
    update();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      onComplete();
    }
  }, 1000);
}

async function submitQuiz(quizQuestions, userAnswers) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  const localScore = calculateScore(quizQuestions, userAnswers);
  setLocal(STORAGE_KEYS.score, localScore);

  await requestApi("/submit", "POST", {
    questions: quizQuestions,
    userAnswers
  });

  updateLeaderboard(localScore, quizQuestions.length);
  window.location.href = "result.html";
}

function calculateScore(quizQuestions, answers) {
  let score = 0;
  quizQuestions.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      score += 1;
    }
  });
  return score;
}

function updateLeaderboard(score, totalQuestions) {
  const settings = getLocal(STORAGE_KEYS.settings);
  const leaderboard = getLocal(STORAGE_KEYS.leaderboard) || [];

  leaderboard.push({
    name: settings.playerName || "Guest",
    score,
    totalQuestions,
    date: new Date().toISOString()
  });

  leaderboard.sort((a, b) => b.score - a.score);
  setLocal(STORAGE_KEYS.leaderboard, leaderboard.slice(0, 10));
}

async function setupResultPage() {
  const scoreText = document.getElementById("scoreText");
  const summaryText = document.getElementById("summaryText");
  const reviewContainer = document.getElementById("reviewContainer");

  if (!scoreText || !summaryText || !reviewContainer) {
    return;
  }

  const allQuestions = await getQuestions();
  const order = getLocal(STORAGE_KEYS.quizOrder) || [];
  const answers = getLocal(STORAGE_KEYS.userAnswers) || [];
  const score = Number(getLocal(STORAGE_KEYS.score) || 0);

  const quizQuestions = order
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter(Boolean);

  scoreText.textContent = `Score: ${score} / ${quizQuestions.length}`;
  summaryText.textContent = score >= quizQuestions.length / 2
    ? "Great job! You passed the quiz."
    : "Good try. Review the answers and try again.";

  reviewContainer.innerHTML = quizQuestions
    .map((question, idx) => {
      const userAnswerIndex = answers[idx];
      const isCorrect = userAnswerIndex === question.correctAnswer;
      const userAnswerText = userAnswerIndex === null || userAnswerIndex === undefined
        ? "Not Answered"
        : question.options[userAnswerIndex];
      const correctText = question.options[question.correctAnswer];

      return `
        <article class="review-item">
          <p><strong>Q${idx + 1}:</strong> ${question.question}</p>
          <p class="${isCorrect ? "good" : "bad"}">Your answer: ${userAnswerText}</p>
          <p class="good">Correct answer: ${correctText}</p>
        </article>
      `;
    })
    .join("");
}

function setupAdminPage() {
  const form = document.getElementById("adminForm");
  const adminMessage = document.getElementById("adminMessage");

  if (!form || !adminMessage) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const questionInput = document.getElementById("questionInput").value.trim();
    const option1 = document.getElementById("option1").value.trim();
    const option2 = document.getElementById("option2").value.trim();
    const option3 = document.getElementById("option3").value.trim();
    const option4 = document.getElementById("option4").value.trim();
    const correctOption = Number(document.getElementById("correctOption").value) - 1;
    const difficulty = document.getElementById("adminDifficulty").value;
    const category = document.getElementById("adminCategory").value.trim();

    if (!questionInput || !option1 || !option2 || !option3 || !option4 || correctOption < 0 || correctOption > 3 || !category) {
      adminMessage.textContent = "Please fill all fields correctly.";
      return;
    }

    const questions = getLocal(STORAGE_KEYS.questions) || [];
    const nextId = questions.length ? Math.max(...questions.map((q) => q.id)) + 1 : 1;

    const newQuestion = {
      id: nextId,
      question: questionInput,
      options: [option1, option2, option3, option4],
      correctAnswer: correctOption,
      difficulty,
      category
    };

    questions.push(newQuestion);
    setLocal(STORAGE_KEYS.questions, questions);

    await requestApi("/questions", "POST", newQuestion);

    adminMessage.textContent = "Question added successfully.";
    form.reset();
  });
}

async function requestApi(path, method, body = null) {
  try {
    const options = {
      method,
      headers: {}
    };

    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    // Backend is optional. Frontend works with localStorage if API is unavailable.
    return null;
  }
}

function getLocal(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
