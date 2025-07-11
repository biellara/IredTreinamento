
function setupQuizzesManagement() {
    let quizzesTable;

    const questionTemplate = (questionIndex) => `
        <div class="question-block" data-index="${questionIndex}">
            <div class="form-group">
                <label>Texto da Pergunta ${questionIndex + 1}</label>
                <input type="text" class="form-input question-text" required>
            </div>
            <div class="options-container ml-4"></div>
            <button type="button" class="btn btn-secondary btn-sm add-option-btn mt-2">Adicionar Opção</button>
            <button type="button" class="btn btn-danger btn-sm remove-question-btn mt-2">Remover Pergunta</button>
            <hr class="my-4">
        </div>
    `;

    const optionTemplate = (questionIndex, optionIndex) => `
        <div class="option-block flex items-center gap-2 mb-2">
            <input type="radio" name="correctAnswer_${questionIndex}" value="${optionIndex}" class="correct-answer-radio" required>
            <input type="text" class="form-input option-text" placeholder="Texto da opção ${optionIndex + 1}" required>
            <button type="button" class="btn-action remove-option-btn" title="Remover Opção">&times;</button>
        </div>
    `;

    async function loadQuizzes() {
        try {
            const response = await secureFetch('/api/getQuiz');
            if (!response.ok) throw new Error('Falha ao carregar quizzes.');
            const quizzes = await response.json();

            if ($.fn.DataTable.isDataTable('#quizzesTable')) {
                $('#quizzesTable').DataTable().destroy();
            }

            quizzesTable = $('#quizzesTable').DataTable({
                data: quizzes,
                responsive: true,
                columns: [
                    { data: 'title', title: 'Título' },
                    { data: 'description', title: 'Descrição', defaultContent: '-' },
                    {
                        data: 'questions', title: 'Nº de Perguntas',
                        render: (data) => data ? data.length : 0
                    },
                    {
                        data: 'id', title: 'Ações', orderable: false, className: 'actions-cell',
                        render: (data) => `
                            <button class="btn-action edit-quiz-btn" data-id="${data}" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete-quiz-btn" data-id="${data}" title="Excluir"><i class="fas fa-trash"></i></button>
                        `
                    }
                ],
                language: {}
            });
        } catch (error) {
            console.error("Erro ao carregar quizzes:", error);
        }
    }

    function openQuizModal(quiz = null) {
        $('#quizForm')[0].reset();
        $('#quizId').val('');
        $('#questions-container').empty();

        if (quiz) {
            $('#quizModalTitle').text('Editar Quiz');
            $('#quizId').val(quiz.id);
            $('#quizTitle').val(quiz.title);
            $('#quizDescription').val(quiz.description);
            quiz.questions.forEach((q, qIndex) => addQuestionField(qIndex, q));
        } else {
            $('#quizModalTitle').text('Adicionar Novo Quiz');
            addQuestionField(0);
        }
        $('#quizModal').addClass('active');
    }

    function addQuestionField(index, data = null) {
        const questionsContainer = $('#questions-container');
        questionsContainer.append(questionTemplate(index));
        const newQuestionBlock = questionsContainer.find(`.question-block[data-index="${index}"]`);

        if (data) {
            newQuestionBlock.find('.question-text').val(data.question || data.text);
            data.options.forEach((opt, oIndex) => {
                addOptionField(newQuestionBlock.find('.options-container'), index, oIndex, opt);
            });
            const correctIndex = data.options.indexOf(data.answer || data.correctAnswer);
            if (correctIndex !== -1) {
                newQuestionBlock.find(`input[name="correctAnswer_${index}"][value="${correctIndex}"]`).prop('checked', true);
            }
        } else {
            addOptionField(newQuestionBlock.find('.options-container'), index, 0);
            addOptionField(newQuestionBlock.find('.options-container'), index, 1);
        }
    }

    function addOptionField(container, qIndex, oIndex, value = '') {
        container.append(optionTemplate(qIndex, oIndex));
        if (value) {
            container.find('.option-text').last().val(value);
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const quizId = $('#quizId').val();

        const quizData = {
            title: $('#quizTitle').val(),
            description: $('#quizDescription').val(),
            questions: []
        };

        let valid = true;
        let firstInvalid = null;

        $('#questions-container .question-block').each(function () {
            const questionBlock = $(this);
            questionBlock.removeClass('border border-red-500');
            const qIndex = questionBlock.data('index');
            const questionText = questionBlock.find('.question-text').val().trim();
            const options = [];
            questionBlock.find('.option-text').each(function () {
                const opt = $(this).val().trim();
                if (opt) options.push(opt);
            });
            const correctOptionIndex = questionBlock.find(`input[name="correctAnswer_${qIndex}"]:checked`).val();
            const correctAnswer = options[correctOptionIndex];

            if (!questionText || options.length < 2 || !correctAnswer) {
                valid = false;
                questionBlock.addClass('border border-red-500 p-2 rounded');
                if (!firstInvalid) {
                    firstInvalid = questionBlock;
                }
                return;
            }

            quizData.questions.push({
                question: questionText,
                answer: correctAnswer,
                options: options
            });
        });

        if (!valid) {
            alert("Verifique se todas as perguntas têm texto, pelo menos 2 opções e uma resposta correta selecionada.");
            if (firstInvalid) {
                $('html, body').animate({ scrollTop: firstInvalid.offset().top - 100 }, 300);
                firstInvalid.find('input, textarea').first().focus();
            }
            return;
        }

        const url = quizId ? `/api/getQuiz?id=${quizId}` : '/api/getQuiz';
        const method = quizId ? 'PUT' : 'POST';

        try {
            const response = await secureFetch(url, { method, body: JSON.stringify(quizData) });
            if (!response.ok) throw new Error('Falha ao salvar o quiz.');
            $('#quizModal').removeClass('active');
            await loadQuizzes();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    // Eventos principais
    $('#addQuizBtn').on('click', () => openQuizModal());
    $('#cancelQuizBtn').on('click', () => $('#quizModal').removeClass('active'));
    $('#quizForm').on('submit', handleFormSubmit);

    $('#questions-container').on('click', '.add-option-btn', function () {
        const questionBlock = $(this).closest('.question-block');
        const qIndex = questionBlock.data('index');
        const oIndex = questionBlock.find('.option-block').length;
        addOptionField(questionBlock.find('.options-container'), qIndex, oIndex);
    });

    $('#addQuestionBtn').on('click', function () {
        const qIndex = $('#questions-container').find('.question-block').length;
        addQuestionField(qIndex);
    });

    $('#questions-container').on('click', '.remove-question-btn', function () {
        $(this).closest('.question-block').remove();
    });

    $('#questions-container').on('click', '.remove-option-btn', function () {
        $(this).closest('.option-block').remove();
    });

    // --- Ações dos botões de edição e exclusão ---
    $('#quizzesTable').on('click', '.edit-quiz-btn', async function () {
        const quizId = $(this).data('id');
        try {
            const response = await secureFetch(`/api/getQuiz?id=${quizId}`);
            if (!response.ok) throw new Error('Erro ao buscar dados do quiz.');
            const quiz = await response.json();
            openQuizModal(quiz);
        } catch (err) {
            alert('Não foi possível carregar o quiz para edição.');
            console.error(err);
        }
    });

    $('#quizzesTable').on('click', '.delete-quiz-btn', async function () {
        const quizId = $(this).data('id');
        const confirmDelete = confirm('Deseja realmente excluir este quiz? Esta ação não pode ser desfeita.');
        if (!confirmDelete) return;

        try {
            const response = await secureFetch(`/api/getQuiz?id=${quizId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao excluir quiz.');
            await loadQuizzes();
        } catch (err) {
            alert('Não foi possível excluir o quiz.');
            console.error(err);
        }
    });

    loadQuizzes();
} 
