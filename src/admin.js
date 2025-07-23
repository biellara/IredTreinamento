$(document).ready(function () {
  let easyMDE = null;
  let usersTable, articlesTable, quizzesTable, quizResultsTable;
  let simulationsChart, quizPerformanceChart, quizPassFailChart;

  let allUsers = [], allSimulations = [], allQuizzes = [];

  let userIdToDelete = null, articleIdToDelete = null, quizIdToDelete = null;

  let usersLoaded = false, simulationsLoaded = false, quizzesLoaded = false;
  let articlesLoaded = false, quizResultsLoaded = false;

  const dataTableLanguage = { "sEmptyTable": "Nenhum registro encontrado", "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros", "sInfoEmpty": "Mostrando 0 até 0 de 0 registros", "sInfoFiltered": "(Filtrados de _MAX_ registros)", "sInfoPostFix": "", "sInfoThousands": ".", "sLengthMenu": "_MENU_ resultados por página", "sLoadingRecords": "Carregando...", "sProcessing": "Processando...", "sZeroRecords": "Nenhum registro encontrado", "sSearch": "Pesquisar", "oPaginate": { "sNext": "Próximo", "sPrevious": "Anterior", "sFirst": "Primeiro", "sLast": "Último" }, "oAria": { "sSortAscending": ": Ordenar colunas de forma ascendente", "sSortDescending": ": Ordenar colunas de forma descendente" } };

  window.secureFetch = async function (url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login.html";
      return Promise.reject(new Error("Token não encontrado"));
    }
    const defaultHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };
    try {
      const response = await fetch(url, config);
      if (response.status === 401) {
        localStorage.removeItem("token");
        let serverError = "A sua sessão expirou. Por favor, faça login novamente.";
        try {
          const errorJson = await response.json();
          if (errorJson.error) serverError = `Erro de Autenticação: ${errorJson.error}`;
        } catch (e) {}
        alert(serverError);
        window.location.href = "/login.html";
        return Promise.reject(new Error(serverError));
      }
      return response;
    } catch (error) {
      console.error("Fetch error:", error);
      return Promise.reject(error);
    }
  };

  async function setupAdminPage() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login.html";
      return;
    }
    try {
      const decodedToken = jwt_decode(token);
      $("#username-display").text(decodedToken.username || "Utilizador");
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      localStorage.removeItem("token");
      window.location.href = "/login.html";
      return;
    }
    setupNavigation();
    await loadDashboardStats();
    const initialView = window.location.hash || "#dashboard";
    navigateTo(initialView.substring(1));
  }

  function setupNavigation() {
    $(".sidebar-link").on("click", function (e) {
      e.preventDefault();
      const viewName = $(this).attr("href").substring(1);
      navigateTo(viewName);
    });
  }

  async function navigateTo(viewName) {
    const viewTitle = $(`a[href="#${viewName}"] span`).text() || "Dashboard";
    $("#view-title").text(viewTitle);
    $(".view").removeClass("active").addClass("hidden");
    $(`#view-${viewName}`).addClass("active").removeClass("hidden");
    $(".sidebar-link").removeClass("active");
    $(`a[href="#${viewName}"]`).addClass("active");
    window.location.hash = viewName;

    if (viewName === "dashboard" && !quizResultsLoaded) {
      await loadAndRenderQuizData();
      quizResultsLoaded = true;
    }
    if (viewName === "users" && !usersLoaded) {
      await loadUsers();
      usersLoaded = true;
    }
    if (viewName === "simulations" && !simulationsLoaded) {
      await setupSimulationsView();
      simulationsLoaded = true;
    }
    if (viewName === "quizzes" && !quizzesLoaded) {
      await loadQuizzesManagement();
      quizzesLoaded = true;
    }
    if (viewName === "articles" && !articlesLoaded) {
      await loadArticles();
      articlesLoaded = true;
    }
  }

  async function loadDashboardStats() {
    try {
      const [usersResponse, simsResponse, quizzesResponse] = await Promise.all([
        secureFetch("/api/users"),
        secureFetch("/api/getSimulations?view=admin"),
        secureFetch("/api/getQuiz"),
      ]);

      if (usersResponse.ok) {
        allUsers = await usersResponse.json();
        $("#stats-total-users").text(allUsers.length);
      }
      if (simsResponse.ok) {
        const simData = await simsResponse.json();
        allSimulations = simData.simulations;
        $("#stats-total-simulations").text(allSimulations.length);
        renderSimulationsChart(allSimulations);
      }
      if (quizzesResponse.ok) {
        allQuizzes = await quizzesResponse.json();
        $("#stats-total-quizzes").text(allQuizzes.length);
      }
    } catch (error) {
      if (error.message && !error.message.includes("Token")) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    }
  }

  async function loadAndRenderQuizData() {
    try {
      const resultsResponse = await secureFetch('/api/getQuiz?view=results');
      if (!resultsResponse.ok) throw new Error('Falha ao carregar resultados dos quizzes.');
      
      const results = await resultsResponse.json();
      const quizzes = allQuizzes.length > 0 ? allQuizzes : await (await secureFetch('/api/getQuiz')).json();
      if (allQuizzes.length === 0) allQuizzes = quizzes;

      const quizTitleMap = quizzes.reduce((map, quiz) => {
        map[quiz.id] = quiz.title;
        return map;
      }, {});

      const enrichedResults = results.map(result => ({
        ...result,
        quizTitle: quizTitleMap[result.quizId] || 'Quiz Desconhecido'
      }));

      renderQuizPerformanceChart(enrichedResults);
      renderQuizPassFailChart(enrichedResults);
      renderQuizResultsTable(enrichedResults);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard de quizzes:', error);
      $('#quizPerformanceChart').parent().html('<p style="color: red;">Não foi possível carregar o gráfico de desempenho.</p>');
      $('#quizResultsTable').parent().html('<p style="color: red;">Não foi possível carregar a tabela de resultados.</p>');
    }
  }

  async function setupSimulationsView() {
    try {
        let simulations = allSimulations;
        if (simulations.length === 0) {
            const response = await secureFetch('/api/getSimulations?view=admin');
            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
            const data = await response.json();
            simulations = data.simulations || [];
            allSimulations = simulations;
        }
        if (simulations.length === 0) {
            $('#view-simulations .content-card').html('<p class="text-center text-gray-500 p-10">Nenhuma simulação encontrada.</p>');
            return;
        }
        populateUserFilter(simulations);
        if ($.fn.DataTable.isDataTable('#simulationsTable')) {
            $('#simulationsTable').DataTable().destroy();
        }
        $('#simulationsTable tbody').empty();
        const table = $('#simulationsTable').DataTable({
            data: simulations, responsive: true, order: [[0, "desc"]],
            columns: [
                { data: 'createdAt', title: 'Data', render: (data) => { if (!data) return 'N/A'; const date = data.seconds ? new Date(data.seconds * 1000) : new Date(data); return date.toLocaleDateString('pt-BR'); }},
                { data: 'username', title: 'Usuário', defaultContent: 'Não informado' },
                { data: 'scenario', title: 'Cenário', defaultContent: 'Não informado' },
                { data: null, title: 'Ações', orderable: false, className: 'actions-cell', render: (data, type, row) => `<button class="btn-action btn-feedback" data-id="${row.id}" title="Ver Feedback"><i class="fas fa-comment-dots"></i></button> <button class="btn-action btn-history" data-id="${row.id}" title="Ver Histórico"><i class="fas fa-history"></i></button>` }
            ],
            language: dataTableLanguage
        });
        setupFilters(table);
        setupModalListeners(simulations);
    } catch (error) {
        console.error('Falha ao carregar o dashboard de simulações:', error);
        $('#view-simulations').html('<p class="text-center text-red-500 p-10">Não foi possível carregar os dados.</p>');
    }
  }

  function populateUserFilter(simulations) {
      const userFilter = $('#userFilter');
      if (userFilter.length) {
          userFilter.empty().append('<option value="">Todos os usuários</option>');
          const users = [...new Set(simulations.map(s => s.username).filter(Boolean))];
          users.sort().forEach(user => userFilter.append(`<option value="${user}">${user}</option>`));
      }
  }

  function setupFilters(table) {
      $('#userFilter').off('change').on('change', function() { table.column(1).search(this.value).draw(); });
      const dateRangeInput = document.querySelector("#dateRange");
      if (dateRangeInput && !dateRangeInput._flatpickr) {
          flatpickr(dateRangeInput, {
              mode: "range", dateFormat: "d/m/Y", altInput: true, altFormat: "d/m/Y",
              onChange: function(selectedDates) {
                  $.fn.dataTable.ext.search.pop();
                  if (selectedDates.length === 2) {
                      const [start, end] = selectedDates;
                      $.fn.dataTable.ext.search.push((settings, data) => {
                          const dateStr = data[0];
                          if (!dateStr) return false;
                          const parts = dateStr.split('/');
                          const rowDate = new Date(parts[2], parts[1] - 1, parts[0]);
                          return rowDate >= start && rowDate <= end;
                      });
                  }
                  table.draw();
              }
          });
      }
  }

  function setupModalListeners(simulations) {
      const container = $('#view-simulations');
      container.off('click', '.btn-feedback').on('click', '.btn-feedback', function() {
          const simulation = simulations.find(s => s.id === $(this).data('id'));
          if (simulation) {
              let feedbackHtml = generateHeaderHtml(simulation);
              feedbackHtml += `<h4 style="margin-top: 1rem; font-weight: 600;">Feedback do Analista QA</h4>`;
              if (typeof simulation.feedback === 'string' && !simulation.feedback.startsWith('[')) {
                  feedbackHtml += `<div>${formatText(simulation.feedback)}</div>`;
              } else {
                  feedbackHtml += "<p>Feedback não disponível.</p>";
              }
              $('#simulationModal #modal-body-feedback').html(feedbackHtml);
              setupExportButtons(simulation);
              window.openSimulationModal();
          }
      });
      container.off('click', '.btn-history').on('click', '.btn-history', function() {
          const simulation = simulations.find(s => s.id === $(this).data('id'));
          if (simulation) {
              let historyHtml = generateHeaderHtml(simulation);
              historyHtml += `<h4 style="margin-top: 1rem; font-weight: 600;">Histórico da Conversa</h4>`;
              const conversationData = Array.isArray(simulation.chatHistory) ? simulation.chatHistory : [];
              if (conversationData.length > 0) {
                  conversationData.forEach(msg => {
                      if (msg.role !== 'user' && msg.role !== 'model') return;
                      const speaker = msg.role === 'user' ? 'Atendente' : 'Cliente';
                      const text = msg.parts?.[0]?.text || '';
                      historyHtml += `<p><strong>${speaker}:</strong> ${formatText(text)}</p>`;
                  });
              } else {
                  historyHtml += "<p>Histórico não disponível.</p>";
              }
              $('#historyModal #modal-body-history').html(historyHtml);
              window.openHistoryModal();
              setupExportHistoryButtons(simulation);
          }
      });
  }

  function generateHeaderHtml(simulation) {
      const username = simulation.username || 'Não informado';
      const scenario = simulation.scenario || '-';
      const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
      return `<p><strong>Usuário:</strong> ${username}</p><p><strong>Cenário:</strong> ${scenario}</p><p><strong>Data:</strong> ${date.toLocaleString('pt-BR')}</p><hr>`;
  }

  function formatText(text) {
      if (typeof text !== 'string') return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }

  function setupExportButtons(simulation) {
      const exportContainer = $('#simulationModal #modal-export-buttons');
      exportContainer.empty();
      const btnPdf = $('<button class="btn btn-secondary">Exportar PDF</button>').on('click', () => exportToPdf(simulation));
      const btnCsv = $('<button class="btn btn-secondary">Exportar CSV</button>').on('click', () => exportToCsv(simulation));
      exportContainer.append(btnPdf, btnCsv);
  }

  function exportToPdf(simulation) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const username = simulation.username || 'Desconhecido';
      const scenario = simulation.scenario || '-';
      const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
      const margin = 10, pageHeight = doc.internal.pageSize.height, lineHeight = 7;
      let y = margin;
      doc.setFontSize(12);
      doc.text(`Usuário: ${username}`, margin, y);
      doc.text(`Cenário: ${scenario}`, margin, y += lineHeight);
      doc.text(`Data: ${date.toLocaleString('pt-BR')}`, margin, y += lineHeight);
      doc.line(margin, y += 2, 200, y);
      y += lineHeight;
      doc.setFontSize(14);
      doc.text("Feedback do Analista QA", margin, y);
      y += lineHeight;
      doc.setFontSize(12);
      const feedback = typeof simulation.feedback === 'string' ? simulation.feedback : 'Não disponível';
      const paragraphs = feedback.split('\n');
      paragraphs.forEach(paragraph => {
          const lines = doc.splitTextToSize(paragraph.trim(), 180);
          lines.forEach(line => {
              if (y + lineHeight > pageHeight - margin) { doc.addPage(); y = margin; }
              doc.text(line, margin, y);
              y += lineHeight;
          });
          y += lineHeight;
      });
      doc.save(`feedback_${username}.pdf`);
  }

  function exportToCsv(simulation) {
      const username = simulation.username || 'Desconhecido';
      const scenario = simulation.scenario || '-';
      const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
      const feedback = typeof simulation.feedback === 'string' ? simulation.feedback.replace(/\n/g, ' ') : 'Não disponível';
      const csvContent = [['Usuário', 'Cenário', 'Data', 'Feedback'], [username, scenario, date.toLocaleString('pt-BR'), `"${feedback}"`]].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback_${username}.csv`;
      a.click();
      URL.revokeObjectURL(url);
  }

  function setupExportHistoryButtons(simulation) {
      const container = $('#modal-export-history-buttons');
      container.empty();
      const btnPdf = $('<button class="btn btn-secondary">Exportar PDF</button>').on('click', () => exportHistoryToPdf(simulation));
      const btnCsv = $('<button class="btn btn-secondary">Exportar CSV</button>').on('click', () => exportHistoryToCsv(simulation));
      container.append(btnPdf, btnCsv);
  }

  function exportHistoryToPdf(simulation) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const margin = 10, pageHeight = doc.internal.pageSize.height, lineHeight = 7;
      let y = margin;
      const username = simulation.username || 'Desconhecido';
      const scenario = simulation.scenario || '-';
      const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
      doc.setFontSize(12);
      doc.text(`Usuário: ${username}`, margin, y);
      doc.text(`Cenário: ${scenario}`, margin, y += lineHeight);
      doc.text(`Data: ${date.toLocaleString('pt-BR')}`, margin, y += lineHeight);
      doc.line(margin, y += 2, 200, y);
      y += lineHeight;
      doc.setFontSize(14);
      doc.text("Histórico da Conversa", margin, y);
      y += lineHeight;
      doc.setFontSize(12);
      const chat = Array.isArray(simulation.chatHistory) ? simulation.chatHistory : [];
      chat.forEach(msg => {
          if (msg.role !== 'user' && msg.role !== 'model') return;
          const speaker = msg.role === 'user' ? 'Atendente' : 'Cliente';
          const text = msg.parts?.[0]?.text || '';
          const lines = doc.splitTextToSize(`${speaker}: ${text}`, 180);
          lines.forEach(line => {
              if (y + lineHeight > pageHeight - margin) { doc.addPage(); y = margin; }
              doc.text(line, margin, y);
              y += lineHeight;
          });
          y += lineHeight;
      });
      doc.save(`conversa_${username}.pdf`);
  }

  function exportHistoryToCsv(simulation) {
      const username = simulation.username || 'Desconhecido';
      const scenario = simulation.scenario || '-';
      const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
      const chat = Array.isArray(simulation.chatHistory) ? simulation.chatHistory : [];
      const rows = [['Usuário', 'Cenário', 'Data'], [username, scenario, date.toLocaleString('pt-BR')], [], ['Quem', 'Mensagem']];
      chat.forEach(msg => {
          if (msg.role !== 'user' && msg.role !== 'model') return;
          const speaker = msg.role === 'user' ? 'Atendente' : 'Cliente';
          const text = msg.parts?.[0]?.text?.replace(/\n/g, ' ') || '';
          rows.push([speaker, `"${text}"`]);
      });
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversa_${username}.csv`;
      a.click();
      URL.revokeObjectURL(url);
  }
  
  async function loadQuizzesManagement() {
    try {
        let quizzes = allQuizzes;
        if (quizzes.length === 0) {
            const response = await secureFetch('/api/getQuiz');
            if (!response.ok) throw new Error('Falha ao carregar quizzes.');
            quizzes = await response.json();
            allQuizzes = quizzes;
        }

        if ($.fn.DataTable.isDataTable('#quizzesTable')) {
            $('#quizzesTable').DataTable().destroy();
        }

        quizzesTable = $('#quizzesTable').DataTable({
            data: quizzes,
            responsive: true,
            columns: [
                { data: 'title', title: 'Título' },
                { data: 'description', title: 'Descrição', defaultContent: '-' },
                { data: 'questions', title: 'Nº de Perguntas', render: data => Array.isArray(data) ? data.length : 0 },
                { data: 'id', title: 'Ações', orderable: false, render: (data, type, row) => `<button class="btn-action edit-btn" data-id="${row.id}" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn-action delete-btn" data-id="${row.id}" title="Excluir"><i class="fas fa-trash"></i></button>` }
            ],
            language: dataTableLanguage
        });
    } catch (error) {
        console.error('Erro ao carregar gestão de quizzes:', error);
        $('#view-quizzes .content-card-header').after('<p style="color:red;">Não foi possível carregar os quizzes.</p>');
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
          if (quiz.questions && quiz.questions.length > 0) {
              quiz.questions.forEach(q => addQuestionHTML(q));
          }
      } else {
          $('#quizModalTitle').text('Adicionar Novo Quiz');
          addQuestionHTML();
      }
      $('#quizModal').addClass('active');
  }

  function addQuestionHTML(question = {}) {
      const questionIndex = $('#questions-container .question-block').length;
      const questionId = `question-${questionIndex}`;
      const options = question.options || ['', ''];
      const answer = question.answer || '';

      let optionsHTML = options.map((opt, optIndex) => `
          <div class="option-entry">
              <input type="radio" name="correct-answer-${questionIndex}" value="${opt}" ${opt === answer ? 'checked' : ''} required>
              <input type="text" class="form-input option-input" placeholder="Opção ${optIndex + 1}" value="${opt}" required>
              <button type="button" class="btn-remove-option">&times;</button>
          </div>
      `).join('');

      const questionBlock = `
          <div class="question-block" id="${questionId}">
              <div class="question-header">
                  <h5>Pergunta ${questionIndex + 1}</h5>
                  <button type="button" class="btn-remove-question">&times;</button>
              </div>
              <textarea class="form-input question-text" placeholder="Digite a pergunta aqui..." required>${question.question || ''}</textarea>
              <div class="options-container">${optionsHTML}</div>
              <button type="button" class="btn-add-option">Adicionar Opção</button>
          </div>
      `;
      $('#questions-container').append(questionBlock);
  }

  function renderSimulationsChart(simulations) {
    if (typeof Chart === "undefined" || !simulations.length) return;
    const ctx = document.getElementById("simulationsChart").getContext("2d");
    const simulationsByDay = simulations.reduce((acc, sim) => {
      if (!sim.createdAt) return acc;
      const seconds = sim.createdAt.seconds || sim.createdAt._seconds;
      const dateObj = seconds ? new Date(seconds * 1000) : new Date(sim.createdAt);
      if (isNaN(dateObj.getTime())) return acc;
      const date = dateObj.toLocaleDateString("pt-BR");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const sortedDates = Object.keys(simulationsByDay).sort((a, b) => {
      const parse = (str) => new Date(str.split("/").reverse().join("-"));
      return parse(a) - parse(b);
    });
    const data = sortedDates.map((date) => simulationsByDay[date]);
    if (typeof simulationsChart !== "undefined" && simulationsChart) {
      simulationsChart.destroy();
    }
    simulationsChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: sortedDates,
        datasets: [{ label: "Nº de Simulações", data, borderColor: "#991b1b", backgroundColor: "rgba(213, 43, 30, 0.2)", fill: true, tension: 0.3 }],
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
    });
  }
  
  function renderQuizPerformanceChart(results) {
      if (typeof Chart === 'undefined' || !results.length) return;
      const performanceByQuiz = results.reduce((acc, result) => {
          if (!acc[result.quizTitle]) {
              acc[result.quizTitle] = { totalScore: 0, count: 0 };
          }
          acc[result.quizTitle].totalScore += result.score;
          acc[result.quizTitle].count++;
          return acc;
      }, {});
      const labels = Object.keys(performanceByQuiz);
      const data = labels.map(label => {
          const { totalScore, count } = performanceByQuiz[label];
          return (totalScore / count).toFixed(2);
      });
      const ctx = document.getElementById('quizPerformanceChart').getContext('2d');
      if (quizPerformanceChart) quizPerformanceChart.destroy();
      quizPerformanceChart = new Chart(ctx, {
          type: 'bar',
          data: {
              labels: labels,
              datasets: [{
                  label: 'Nota Média (%)',
                  data: data,
                  backgroundColor: 'rgba(185, 28, 28, 0.6)',
                  borderColor: 'rgba(185, 28, 28, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true, maintainAspectRatio: false,
              scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function(value) { return value + "%" } } } },
              plugins: { legend: { display: false } }
          }
      });
  }

  function renderQuizPassFailChart(results) {
      if (typeof Chart === 'undefined' || !results.length) return;
      const passMark = 70;
      let passed = 0;
      let failed = 0;
      results.forEach(result => {
          if (result.score >= passMark) { passed++; } else { failed++; }
      });
      const ctx = document.getElementById('quizPassFailChart').getContext('2d');
      if (quizPassFailChart) quizPassFailChart.destroy();
      quizPassFailChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: ['Aprovados', 'Reprovados'],
              datasets: [{
                  label: 'Resultados',
                  data: [passed, failed],
                  backgroundColor: ['rgba(22, 163, 74, 0.7)', 'rgba(220, 38, 38, 0.7)'],
                  borderColor: ['rgba(22, 163, 74, 1)', 'rgba(220, 38, 38, 1)'],
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true, maintainAspectRatio: false,
              plugins: {
                  legend: { position: 'top' },
                  tooltip: {
                      callbacks: {
                          label: function(context) {
                              let label = context.label || '';
                              if (label) { label += ': '; }
                              if (context.parsed !== null) {
                                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(2) + '%';
                                  label += `${context.raw} (${percentage})`;
                              }
                              return label;
                          }
                      }
                  }
              }
          }
      });
  }

  function renderQuizResultsTable(results) {
      if ($.fn.DataTable.isDataTable('#quizResultsTable')) {
          $('#quizResultsTable').DataTable().destroy();
      }
      quizResultsTable = $('#quizResultsTable').DataTable({
          data: results,
          responsive: true,
          order: [[3, 'desc']],
          columns: [
              { data: 'userEmail', title: 'Colaborador' },
              { data: 'quizTitle', title: 'Quiz' },
              { data: 'score', title: 'Nota', render: data => `${data.toFixed(0)}%` },
              { data: 'submittedAt', title: 'Data', render: data => new Date(data).toLocaleString('pt-BR') }
          ],
          language: dataTableLanguage,
      });
  }
  
  async function loadUsers() {
    try {
      let users = allUsers;
      if (users.length === 0) {
        const response = await secureFetch("/api/users");
        if (!response.ok) throw new Error("Falha ao carregar utilizadores.");
        users = await response.json();
        allUsers = users;
      }
      if ($.fn.DataTable.isDataTable("#usersTable")) $("#usersTable").DataTable().destroy();
      usersTable = $("#usersTable").DataTable({
        data: users,
        responsive: true,
        columns: [
          { data: "username", title: "Username" },
          { data: "email", title: "Email" },
          { data: "role", title: "Função" },
          { data: "id", title: "Ações", orderable: false, render: (data) => `<button class="btn-action edit-btn" data-id="${data}" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn-action delete-btn" data-id="${data}" title="Excluir"><i class="fas fa-trash"></i></button>` },
        ],
        language: dataTableLanguage,
      });
    } catch (error) {
      if (error.message && !error.message.includes("Token"))
        alert("Não foi possível carregar os dados dos utilizadores.");
    }
  }

  function openUserModal(user = null) {
    $("#userForm")[0].reset();
    $("#userId").val("");
    $("#email").prop("disabled", false);
    $("#password").prop("required", true);
    $("#passwordHelp").hide();
    if (user) {
      $("#userModalTitle").text("Editar Colaborador");
      $("#userId").val(user.id);
      $("#username").val(user.username);
      $("#email").val(user.email).prop("disabled", true);
      $("#role").val(user.role);
      $("#password").prop("required", false);
      $("#passwordHelp").show();
    } else {
      $("#userModalTitle").text("Adicionar Novo Colaborador");
    }
    $("#userModal").addClass("active");
  }

  async function loadArticles() {
    try {
      const response = await secureFetch("/api/articles");
      if (!response.ok) throw new Error("Falha ao carregar artigos.");
      const articles = await response.json();
      if ($.fn.DataTable.isDataTable("#articlesTable")) {
        $("#articlesTable").DataTable().destroy();
      }
      articlesTable = $("#articlesTable").DataTable({
        data: articles,
        responsive: true,
        columns: [
          { data: "title", title: "Título" },
          { data: "description", title: "Descrição" },
          { data: "content", title: "Conteúdo", render: (data) => { const plainText = $("<div>").html(data).text(); return plainText.length > 80 ? plainText.substring(0, 80) + "..." : plainText; } },
          { data: "createdAt", title: "Criado em", render: (data) => { if (!data) return "N/A"; const seconds = data.seconds || data._seconds; if (seconds) { return new Date(seconds * 1000).toLocaleDateString("pt-BR"); } const parsed = new Date(data); return isNaN(parsed) ? "N/A" : parsed.toLocaleDateString("pt-BR"); } },
          { data: "id", title: "Ações", orderable: false, render: (data, type, row) => `<button class="btn-action edit-btn" data-id="${row.id}" title="Editar"><i class="fas fa-edit"></i></button> <button class="btn-action delete-btn" data-id="${row.id}" title="Excluir"><i class="fas fa-trash"></i></button>` },
          { data: "userId", title: "Criado por", render: (data) => data || "Desconhecido" }
        ],
        language: dataTableLanguage,
      });
    } catch (error) {
      if (error.message && !error.message.includes("Token"))
        alert("Não foi possível carregar os dados dos artigos.");
    }
  }

  function openArticleModal(article = null) {
    $("#articleForm")[0].reset();
    $("#articleId").val("");
    $("#articleType").val(article ? article.type || "activity" : "activity");
    setTimeout(() => {
      if (easyMDE) {
        easyMDE.toTextArea();
        easyMDE = null;
      }
      easyMDE = new EasyMDE({
        element: document.getElementById("articleContent"),
        spellChecker: false, status: false,
        renderingConfig: { singleLineBreaks: true, codeSyntaxHighlighting: true },
        toolbar: ["bold", "italic", "strikethrough", "|", "heading", "quote", "unordered-list", "ordered-list", "|", "link", "image", "code", "|", "preview", "guide"],
        forceSync: true,
      });
      if (article) {
        $("#articleModalTitle").text("Editar Artigo");
        $("#articleId").val(article.id);
        $("#articleTitle").val(article.title);
        $("#articleDescription").val(article.description);
        easyMDE.value(article.content || "");
      } else {
        $("#articleModalTitle").text("Adicionar Novo Artigo");
        easyMDE.value("");
      }
    }, 10);
    $("#articleModal").addClass("active");
  }

  $("#addQuizBtn").on('click', () => openQuizModal());
  $('#quizzesTable').on('click', '.edit-btn', function() {
      const quizId = $(this).data('id');
      const quizData = allQuizzes.find(q => q.id === quizId);
      if (quizData) openQuizModal(quizData);
  });
  $('#quizzesTable').on('click', '.delete-btn', function() {
      quizIdToDelete = $(this).data('id');
      $('#deleteModal .modal-title').text('Confirmar Exclusão de Quiz');
      $('#deleteModal p').text('Tem a certeza de que deseja excluir este quiz? Esta ação não pode ser revertida.');
      $('#deleteModal').addClass('active');
  });

  $('#quizForm').on('submit', async function(e) {
      e.preventDefault();
      const quizId = $('#quizId').val();
      const questions = [];
      $('.question-block').each(function() {
          const questionText = $(this).find('.question-text').val();
          const options = [];
          $(this).find('.option-input').each(function() {
              options.push($(this).val());
          });
          const answer = $(this).find('input[type=radio]:checked').val();
          if (questionText && options.length >= 2 && answer) {
              questions.push({ question: questionText, options, answer });
          }
      });

      if (questions.length === 0) {
          alert('Por favor, adicione pelo menos uma pergunta válida com duas opções e uma resposta correta.');
          return;
      }

      const data = {
          title: $('#quizTitle').val(),
          description: $('#quizDescription').val(),
          questions: questions
      };

      const url = quizId ? `/api/getQuiz?id=${quizId}` : '/api/getQuiz';
      const method = quizId ? 'PUT' : 'POST';

      try {
          const response = await secureFetch(url, { method, body: JSON.stringify(data) });
          if (!response.ok) throw new Error((await response.json()).error || 'Falha ao salvar o quiz.');
          
          $('#quizModal').removeClass('active');
          allQuizzes = [];
          await loadQuizzesManagement();
      } catch (error) {
          alert(`Erro: ${error.message}`);
      }
  });

  $('#questions-container').on('click', '.btn-add-option', function() {
      const optionsContainer = $(this).siblings('.options-container');
      const questionIndex = $(this).closest('.question-block').index();
      const optionIndex = optionsContainer.find('.option-entry').length;
      const newOption = `
          <div class="option-entry">
              <input type="radio" name="correct-answer-${questionIndex}" value="" required>
              <input type="text" class="form-input option-input" placeholder="Opção ${optionIndex + 1}" value="" required>
              <button type="button" class="btn-remove-option">&times;</button>
          </div>`;
      optionsContainer.append(newOption);
  });

  $('#questions-container').on('click', '.btn-remove-option', function() {
      $(this).parent('.option-entry').remove();
  });

  $('#questions-container').on('click', '.btn-remove-question', function() {
      $(this).closest('.question-block').remove();
  });

  $('#addQuestionBtn').on('click', () => addQuestionHTML());
  $('#cancelQuizBtn, #quizModal .modal-close-btn').on('click', () => $('#quizModal').removeClass('active'));
  
  $("#addUserBtn").on("click", () => openUserModal());
  $("#usersTable").on("click", ".edit-btn", function () { openUserModal(usersTable.row($(this).parents("tr")).data()); });
  $("#usersTable").on("click", ".delete-btn", function () {
    userIdToDelete = usersTable.row($(this).parents("tr")).data().id;
    $("#deleteModal .modal-title").text("Confirmar Exclusão de Colaborador");
    $("#deleteModal p").text("Tem a certeza de que deseja excluir este colaborador? Esta ação não pode ser revertida.");
    $("#deleteModal").addClass("active");
  });

  $("#userForm").on("submit", async function (e) {
    e.preventDefault();
    const userId = $("#userId").val();
    const data = { username: $("#username").val(), email: $("#email").val(), role: $("#role").val() };
    const password = $("#password").val();
    if (password) data.password = password;
    const url = userId ? `/api/users?id=${userId}` : "/api/users";
    const method = userId ? "PUT" : "POST";
    try {
      const response = await secureFetch(url, { method, body: JSON.stringify(data) });
      if (!response.ok) throw new Error((await response.json()).error || "Falha ao salvar utilizador.");
      $("#userModal").removeClass("active");
      allUsers = [];
      await loadUsers();
    } catch (error) {
      if (error.message && !error.message.includes("Token")) alert(`Erro: ${error.message}`);
    }
  });

  $("#addArticleBtn").on("click", () => openArticleModal());
  $("#articlesTable").on("click", ".edit-btn", function () { openArticleModal(articlesTable.row($(this).parents("tr")).data()); });
  $("#articlesTable").on("click", ".delete-btn", function () {
    articleIdToDelete = articlesTable.row($(this).parents("tr")).data().id;
    $("#deleteModal .modal-title").text("Confirmar Exclusão de Artigo");
    $("#deleteModal p").text("Tem a certeza de que deseja excluir este artigo? Esta ação não pode ser revertida.");
    $("#deleteModal").addClass("active");
  });

  $("#articleForm").on("submit", async function (e) {
    e.preventDefault();
    if (!easyMDE || !easyMDE.value().trim()) {
      alert("O conteúdo do artigo é obrigatório.");
      return;
    }
    const articleId = $("#articleId").val();
    const data = { title: $("#articleTitle").val(), description: $("#articleDescription").val(), content: easyMDE.value(), type: $("#articleType").val() };
    const url = articleId ? `/api/articles?id=${articleId}` : "/api/articles";
    const method = articleId ? "PUT" : "POST";
    try {
      const response = await secureFetch(url, { method, body: JSON.stringify(data) });
      if (!response.ok) throw new Error((await response.json()).error || "Falha ao salvar o artigo.");
      $("#articleModal").removeClass("active");
      await loadArticles();
    } catch (error) {
      if (error.message && !error.message.includes("Token")) alert(`Erro: ${error.message}`);
    }
  });

  $("#confirmDeleteBtn").on("click", async function () {
    const currentView = window.location.hash;
    let url, successCallback, errorMsg;

    if (currentView.includes("users") && userIdToDelete) {
      url = `/api/users?id=${userIdToDelete}`;
      successCallback = loadUsers;
      errorMsg = "Não foi possível excluir o utilizador.";
      userIdToDelete = null;
    } else if (currentView.includes("articles") && articleIdToDelete) {
      url = `/api/articles?id=${articleIdToDelete}`;
      successCallback = loadArticles;
      errorMsg = "Não foi possível excluir o artigo.";
      articleIdToDelete = null;
    } else if (currentView.includes("quizzes") && quizIdToDelete) {
        url = `/api/getQuiz?id=${quizIdToDelete}`;
        successCallback = loadQuizzesManagement;
        errorMsg = "Não foi possível excluir o quiz.";
        quizIdToDelete = null;
    }

    if (url) {
      try {
        const response = await secureFetch(url, { method: "DELETE" });
        if (!response.ok) throw new Error("Falha ao excluir.");
        $("#deleteModal").removeClass("active");
        if (successCallback === loadUsers) allUsers = [];
        if (successCallback === loadQuizzesManagement) allQuizzes = [];
        await successCallback();
      } catch (error) {
        if (error.message && !error.message.includes("Token")) alert(errorMsg);
      }
    }
  });

  $("#cancelBtn, #userModal .modal-close-btn").on("click", () => $("#userModal").removeClass("active"));
  $("#articleModal .modal-close-btn").on("click", () => $("#articleModal").removeClass("active"));
  $("#cancelDeleteBtn, #deleteModal .modal-close-btn").on("click", () => $("#deleteModal").removeClass("active"));

  setupAdminPage();
});

window.openSimulationModal = function () { $("#simulationModal").addClass("active"); };
window.closeSimulationModal = function () { $("#simulationModal").removeClass("active"); };
window.openHistoryModal = function () { $("#historyModal").addClass("active"); };
window.closeHistoryModal = function () { $("#historyModal").removeClass("active"); };
