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
// Novo elemento para status da submissão
const submissionStatusEl = document.getElementById('quiz-submission-status');

let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;
// Array para armazenar as respostas detalhadas do usuário
let userAnswers = [];

async function loadQuizData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return showError('Você precisa estar logado para acessar este quiz.');

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (!quizId) return showError('Nenhum ID de quiz foi fornecido.');

    // Usando a rota que você já tem para buscar um quiz
    const response = await fetch(`/api/getQuiz?id=${quizId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (response.status === 401) {
      return showError('Token inválido ou expirado. Faça login novamente.');
    }

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
  userAnswers = []; // Limpa as respostas anteriores ao reiniciar
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
  const correctAnswerText = questionData.answer;
  const correctIndex = questionData.options.findIndex(opt => opt === correctAnswerText);
  const isCorrect = selectedIndex === correctIndex;

  // --- ATUALIZAÇÃO: Armazena a resposta do usuário ---
  userAnswers.push({
    question: questionData.question,
    selectedOption: questionData.options[selectedIndex],
    correctAnswer: correctAnswerText,
    isCorrect: isCorrect
  });
  // --- FIM DA ATUALIZAÇÃO ---

  document.querySelectorAll('.quiz-option-button').forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIndex) btn.classList.add('correct');
  });

  if (isCorrect) {
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

// --- ATUALIZAÇÃO: Função agora é async para lidar com a API ---
async function showResults() {
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

  // Envia os resultados para o backend
  await submitQuizResults(percentage);
}

// --- ATUALIZAÇÃO: Nova função para enviar os resultados ---
async function submitQuizResults(finalScore) {
  const token = localStorage.getItem('token');
  if (!token) {
    submissionStatusEl.textContent = 'Erro: Usuário não autenticado.';
    submissionStatusEl.className = 'submission-status error';
    return;
  }

  submissionStatusEl.textContent = 'Salvando resultado...';
  submissionStatusEl.className = 'submission-status loading';
  submissionStatusEl.style.display = 'block';

  const payload = {
    quizId: currentQuiz.id,
    answers: userAnswers,
    score: finalScore,
  };

  try {
    const response = await fetch('/api/getQuiz?action=submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Falha ao enviar o resultado.');
    }

    submissionStatusEl.textContent = 'Resultado salvo com sucesso!';
    submissionStatusEl.className = 'submission-status success';

  } catch (error) {
    console.error('Erro ao salvar resultado do quiz:', error);
    submissionStatusEl.textContent = `Erro ao salvar: ${error.message}`;
    submissionStatusEl.className = 'submission-status error';
  }
}
// --- FIM DA ATUALIZAÇÃO ---

function showError(message) {
  loadingView.style.display = 'none';
  quizContainer.innerHTML = `<h1 class="hub-title text-red-600">Erro</h1><p class="hub-subtitle">${message}</p>`;
}

nextButton.addEventListener('click', showNextQuestion);
restartButton.addEventListener('click', startQuiz);

loadQuizData();
