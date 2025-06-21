// quiz.js atualizado para consumir dados diretamente do Firebase Realtime Database

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  databaseURL: "https://SEU_DATABASE.firebaseio.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', async function () {
    let allQuizzes = [];
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let score = 0;

    const quizContainer = document.getElementById('quiz-container');
    const loadingView = document.getElementById('quiz-loading');
    const mainView = document.getElementById('quiz-main-view');
    const resultsView = document.getElementById('quiz-results-view');

    const quizTitleEl = document.getElementById('quiz-title');
    const quizProgressEl = document.getElementById('quiz-progress');
    const quizQuestionEl = document.getElementById('quiz-question');
    const quizOptionsAreaEl = document.getElementById('quiz-options-area');
    const quizFeedbackEl = document.getElementById('quiz-feedback-area');
    const nextButton = document.getElementById('quiz-next-button');
    const restartButton = document.getElementById('quiz-restart-button');

    async function loadQuizData() {
        try {
            const dbRef = ref(database);
            const snapshot = await get(child(dbRef, `quizzes`));
            if (!snapshot.exists()) throw new Error("Nenhum dado encontrado no Firebase.");

            const data = snapshot.val();
            allQuizzes = Object.values(data);

            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('id');

            if (quizId) {
                currentQuiz = allQuizzes.find(q => q.id === quizId);
                if (currentQuiz) {
                    startQuiz();
                } else {
                    showError('Quiz não encontrado.');
                }
            } else {
                showError('Nenhum ID de quiz foi fornecido.');
            }
        } catch (error) {
            console.error(error);
            showError(error.message);
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
        quizFeedbackEl.textContent = '';
        const questionData = currentQuiz.questions[currentQuestionIndex];

        quizTitleEl.textContent = currentQuiz.title;
        quizProgressEl.textContent = `Pergunta ${currentQuestionIndex + 1} de ${currentQuiz.questions.length}`;
        quizQuestionEl.textContent = questionData.question;

        quizOptionsAreaEl.innerHTML = '';
        questionData.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'quiz-option-button';
            button.textContent = option;
            button.addEventListener('click', () => handleAnswer(index, button));
            quizOptionsAreaEl.appendChild(button);
        });
    }

    function handleAnswer(selectedIndex, selectedButton) {
        const questionData = currentQuiz.questions[currentQuestionIndex];
        const correctIndex = questionData.answer;

        document.querySelectorAll('.quiz-option-button').forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === correctIndex) {
                btn.classList.add('correct');
            }
        });

        if (selectedIndex === correctIndex) {
            score++;
            selectedButton.classList.add('correct');
            quizFeedbackEl.textContent = 'Resposta Correta!';
            quizFeedbackEl.className = 'quiz-feedback correct';
        } else {
            selectedButton.classList.add('incorrect');
            quizOptionsAreaEl.childNodes[correctIndex].classList.add('correct');
            quizFeedbackEl.textContent = 'Resposta Incorreta.';
            quizFeedbackEl.className = 'quiz-feedback incorrect';
        }

        nextButton.style.display = 'block';
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
});
