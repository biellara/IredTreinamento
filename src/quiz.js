// quiz.js

// DOM Elements
const quizContainer = document.getElementById('quiz-container');
const loadingView = document.getElementById('quiz-loading');
const mainView = document.getElementById('quiz-main-view');
const resultsView = document.getElementById('quiz-results-view');
const quizTitleEl = document.getElementById('quiz-title');
const quizProgressEl = document.getElementById('quiz-progress');
const quizQuestionEl = document.getElementById('quiz-question');
const quizOptionsAreaEl = document.getElementById('quiz-options-area');
const quizFeedbackEl = document.getElementById('quiz-feedback-area');
const quizFeedbackMessage = document.getElementById('quiz-feedback-message');
const nextButton = document.getElementById('quiz-next-button');
const restartButton = document.getElementById('quiz-restart-button');

let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;

async function loadQuizData() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (!quizId) return showError('Nenhum ID de quiz foi fornecido.');

    const response = await fetch(`/api/getQuiz?id=${quizId}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Erro ao buscar quiz da API');

    const data = await response.json();

    if (!data || !data.questions || data.questions.length === 0) {
      return showError('Quiz não encontrado ou está vazio.');
    }

    currentQuiz = data;
    startQuiz();

  } catch (error) {
    console.error(error);
    showError('Erro ao carregar o quiz.');
  }
}

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  loadingView.style.display = 'none';
  resultsView.style.display = 'none';
  mainView.style.display = 'block';
  displayQuestion();
}

function displayQuestion() {
  nextButton.style.display = 'none';
  quizFeedbackEl.style.display = 'none';
  quizFeedbackMessage.textContent = '';

  const questionData = currentQuiz.questions[currentQuestionIndex];

  quizTitleEl.textContent = currentQuiz.title || 'Quiz';
  quizProgressEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuiz.questions.length}`;
  quizQuestionEl.textContent = questionData.question;

  quizOptionsAreaEl.innerHTML = '';
  questionData.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'quiz-option-button';
    button.textContent = option;
    button.disabled = false;
    button.addEventListener('click', () => handleAnswer(index, button));
    quizOptionsAreaEl.appendChild(button);
  });
}

function handleAnswer(selectedIndex, selectedButton) {
  const questionData = currentQuiz.questions[currentQuestionIndex];
  const correctAnswerText = questionData.answer; // aqui é texto, não índice

  // Descobre índice correto buscando a opção que bate com o texto da resposta
  const correctIndex = questionData.options.findIndex(opt => opt === correctAnswerText);

  document.querySelectorAll('.quiz-option-button').forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) btn.classList.add('correct');
  });

  if (selectedIndex === correctIndex) {
    score++;
    selectedButton.classList.add('correct');
    quizFeedbackMessage.textContent = 'Resposta Correta!';
    quizFeedbackEl.className = 'quiz-feedback correct';
  } else {
    selectedButton.classList.add('incorrect');
    quizOptionsAreaEl.childNodes[correctIndex].classList.add('correct');
    quizFeedbackMessage.textContent = 'Resposta Incorreta.';
    quizFeedbackEl.className = 'quiz-feedback incorrect';
  }

  quizFeedbackEl.style.display = 'block';
  nextButton.style.display = 'inline-block';
}

function showNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuiz.questions.length) {
    displayQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  mainView.style.display = 'none';
  resultsView.style.display = 'block';

  const scoreEl = document.getElementById('quiz-score');
  const feedbackTextEl = document.getElementById('quiz-feedback-text');

  const percentage = Math.round((score / currentQuiz.questions.length) * 100);
  scoreEl.textContent = `${score}/${currentQuiz.questions.length} (${percentage}%)`;

  if (percentage === 100) {
    feedbackTextEl.textContent = 'Excelente! Você dominou este tópico.';
  } else if (percentage >= 75) {
    feedbackTextEl.textContent = 'Muito bom! Continue a praticar.';
  } else {
    feedbackTextEl.textContent = 'Bom esforço. Recomendamos revisar os artigos relacionados e tentar novamente.';
  }
}

function showError(message) {
  loadingView.style.display = 'none';
  quizContainer.innerHTML = `<h1 class="hub-title text-red-600">Erro</h1><p class="hub-subtitle">${message}</p>`;
}

nextButton.addEventListener('click', showNextQuestion);
restartButton.addEventListener('click', startQuiz);

loadQuizData();
