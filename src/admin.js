$(document).ready(function() {
    // --- Variáveis de Controle ---
    let easyMDE = null;
    let usersTable;
    let articlesTable;
    let simulationsChart;

    let userIdToDelete = null;
    let articleIdToDelete = null;

    let usersLoaded = false;
    let simulationsLoaded = false;
    let quizzesLoaded = false;
    let articlesLoaded = false;


    // --- Função Wrapper para Fetch Seguro ---
    window.secureFetch = async function(url, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return Promise.reject(new Error('Token não encontrado'));
        }

        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        const config = { ...options,
            headers: { ...defaultHeaders,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            if (response.status === 401) {
                localStorage.removeItem('token');
                let serverError = 'A sua sessão expirou. Por favor, faça login novamente.';
                try {
                    const errorJson = await response.json();
                    if (errorJson.error) serverError = `Erro de Autenticação: ${errorJson.error}`;
                } catch (e) { /* Ignora falha no parse do JSON */ }
                alert(serverError);
                window.location.href = '/login.html';
                return Promise.reject(new Error(serverError));
            }
            return response;
        } catch (error) {
            console.error("Fetch error:", error);
            return Promise.reject(error);
        }
    }

    // --- Funções de Navegação e Setup ---
    async function setupAdminPage() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const decodedToken = jwt_decode(token);
            $('#username-display').text(decodedToken.username || 'Utilizador');
        } catch (error) {
            console.error("Erro ao decodificar token:", error);
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }

        setupNavigation();
        await loadDashboardStats();

        const initialView = window.location.hash || '#dashboard';
        navigateTo(initialView.substring(1));
    }

    function setupNavigation() {
        $('.sidebar-link').on('click', function(e) {
            e.preventDefault();
            const viewName = $(this).attr('href').substring(1);
            navigateTo(viewName);
        });
    }

    async function navigateTo(viewName) {
        const viewTitle = $(`a[href="#${viewName}"] span`).text() || 'Dashboard';
        $('#view-title').text(viewTitle);

        $('.view').removeClass('active').addClass('hidden');
        $(`#view-${viewName}`).addClass('active').removeClass('hidden');

        $('.sidebar-link').removeClass('active');
        $(`a[href="#${viewName}"]`).addClass('active');

        window.location.hash = viewName;

        if (viewName === 'users' && !usersLoaded) {
            await loadUsers();
            usersLoaded = true;
        }

        if (viewName === 'simulations' && !simulationsLoaded) {
            await loadSimulationsDashboard();
            simulationsLoaded = true;
        }

        if (viewName === 'quizzes' && !quizzesLoaded) {
            await loadQuizzesManagement();
            quizzesLoaded = true;
        }
        
        // NOVO: Condição para carregar os artigos
        if (viewName === 'articles' && !articlesLoaded) {
            await loadArticles();
            articlesLoaded = true;
        }
    }

    // --- Funções de Carregamento de Dados ---

    async function loadSimulationsDashboard() {
        try {
            const response = await fetch('dashboard.html');
            if (!response.ok) throw new Error('Não foi possível carregar o dashboard de simulações.');

            const html = await response.text();
            $('#simulations-dashboard-content').html(html);

            $.getScript('dashboard.js', function() {
                if (typeof setupSimulationsDashboard === 'function') {
                    setupSimulationsDashboard();
                } else {
                    console.error("ERRO CRÍTICO: A função 'setupSimulationsDashboard' não foi encontrada em dashboard.js.");
                }
            });

        } catch (error) {
            console.error("Erro ao carregar dashboard de simulações:", error);
            $('#view-simulations').html('<p style="color: red;">Ocorreu um erro ao carregar esta secção.</p>');
        }
    }

    async function loadQuizzesManagement() {
        $.getScript('criarQuiz.js', function() {
            if (typeof setupQuizzesManagement === 'function') {
                setupQuizzesManagement();
            } else {
                console.error("ERRO CRÍTICO: A função 'setupQuizzesManagement' não foi encontrada em criarQuiz.js.");
            }
        });
    }

    async function loadDashboardStats() {
        try {
            const [usersResponse, simsResponse, quizzesResponse] = await Promise.all([
                secureFetch('/api/users'),
                secureFetch('/api/getSimulations?view=admin'),
                secureFetch('/api/getQuiz')
            ]);

            if (usersResponse.ok) $('#stats-total-users').text((await usersResponse.json()).length);
            if (simsResponse.ok) {
                const { simulations } = await simsResponse.json();
                $('#stats-total-simulations').text(simulations.length);
                renderSimulationsChart(simulations);
            }
            if (quizzesResponse.ok) $('#stats-total-quizzes').text((await quizzesResponse.json()).length);

        } catch (error) {
            if (error.message && !error.message.includes('Token')) {
                console.error("Erro ao carregar estatísticas:", error);
            }
        }
    }
    
    function renderSimulationsChart(simulations) {
    if (typeof Chart === 'undefined') return;

    const ctx = document.getElementById('simulationsChart').getContext('2d');

    // Agrupa simulações por data
    const simulationsByDay = simulations.reduce((acc, sim) => {
        if (!sim.createdAt) return acc;

        const seconds = sim.createdAt.seconds || sim.createdAt._seconds;
        const dateObj = seconds ? new Date(seconds * 1000) : new Date(sim.createdAt);

        if (isNaN(dateObj.getTime())) return acc;

        const date = dateObj.toLocaleDateString('pt-BR');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    // Converte para array e ordena por data real
    const sortedDates = Object.keys(simulationsByDay).sort((a, b) => {
        const parse = str => new Date(str.split('/').reverse().join('-'));
        return parse(a) - parse(b);
    });

    const data = sortedDates.map(date => simulationsByDay[date]);

    // Destroi gráfico anterior se existir
    if (typeof simulationsChart !== 'undefined' && simulationsChart) {
        simulationsChart.destroy();
    }

    // Cria novo gráfico
    simulationsChart = new Chart(ctx, {
        type: 'line',
        data: {
        labels: sortedDates,
        datasets: [{
            label: 'Nº de Simulações',
            data,
            borderColor: '#991b1b',
            backgroundColor: 'rgba(213, 43, 30, 0.2)',
            fill: true,
            tension: 0.3
        }]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true }
        }
        }
    });
    }

    // --- GESTÃO DE COLABORADORES ---
    async function loadUsers() {
        try {
            const response = await secureFetch('/api/users');
            if (!response.ok) throw new Error('Falha ao carregar utilizadores.');
            const users = await response.json();
            if ($.fn.DataTable.isDataTable('#usersTable')) $('#usersTable').DataTable().destroy();
            usersTable = $('#usersTable').DataTable({
                data: users,
                responsive: true,
                columns: [
                    { data: 'username', title: 'Username' },
                    { data: 'email', title: 'Email' },
                    { data: 'role', title: 'Função' },
                    { data: 'id', title: 'Ações', orderable: false, render: (data) => `
                        <button class="btn-action edit-btn" data-id="${data}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete-btn" data-id="${data}" title="Excluir"><i class="fas fa-trash"></i></button>`
                    }
                ],
                language: { "sEmptyTable": "Nenhum registro encontrado", "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros", "sInfoEmpty": "Mostrando 0 até 0 de 0 registros", "sInfoFiltered": "(Filtrados de _MAX_ registros)", "sLengthMenu": "Mostrar _MENU_ registros", "sLoadingRecords": "Carregando...", "sProcessing": "Processando...", "sZeroRecords": "Nenhum registro encontrado", "sSearch": "", "sSearchPlaceholder": "Pesquisar...", "oPaginate": { "sNext": "Próximo", "sPrevious": "Anterior", "sFirst": "Primeiro", "sLast": "Último" }, "oAria": { "sSortAscending": ": Ordenar colunas de forma ascendente", "sSortDescending": ": Ordenar colunas de forma descendente" } }
            });
        } catch (error) {
            if (error.message && !error.message.includes('Token')) alert('Não foi possível carregar os dados dos utilizadores.');
        }
    }

    function openUserModal(user = null) {
        $('#userForm')[0].reset();
        $('#userId').val('');
        $('#email').prop('disabled', false);
        $('#password').prop('required', true);
        $('#passwordHelp').hide();
        if (user) {
            $('#userModalTitle').text('Editar Colaborador');
            $('#userId').val(user.id);
            $('#username').val(user.username);
            $('#email').val(user.email).prop('disabled', true);
            $('#role').val(user.role);
            $('#password').prop('required', false);
            $('#passwordHelp').show();
        } else {
            $('#userModalTitle').text('Adicionar Novo Colaborador');
        }
        $('#userModal').addClass('active');
    }

    // --- GESTÃO DE ARTIGOS (NOVO) ---
    async function loadArticles() {
  try {
    const response = await secureFetch('/api/articles');
    if (!response.ok) throw new Error('Falha ao carregar artigos.');
    const articles = await response.json();

    if ($.fn.DataTable.isDataTable('#articlesTable')) {
      $('#articlesTable').DataTable().destroy();
    }

    articlesTable = $('#articlesTable').DataTable({
      data: articles,
      responsive: true,
      columns: [
        { data: 'title', title: 'Título' },
        { data: 'description', title: 'Descrição' },
        {
          data: 'content',
          title: 'Conteúdo',
          render: (data) => {
            const plainText = $('<div>').html(data).text();
            return plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText;
          }
        },
        {
  data: 'createdAt',
  title: 'Criado em',
  render: (data) => {
    if (!data) return 'N/A';

    const seconds = data.seconds || data._seconds;
    if (seconds) {
      return new Date(seconds * 1000).toLocaleDateString('pt-BR');
    }

    const parsed = new Date(data);
    return isNaN(parsed) ? 'N/A' : parsed.toLocaleDateString('pt-BR');
  }
    },
        {
          data: 'id',
          title: 'Ações',
          orderable: false,
          render: (data, type, row) => `
            <button class="btn-action edit-btn" data-id="${row.id}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-action delete-btn" data-id="${row.id}" title="Excluir"><i class="fas fa-trash"></i></button>`
        }
      ],
      language: {
        "sEmptyTable": "Nenhum registro encontrado",
        "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
        "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
        "sInfoFiltered": "(Filtrados de _MAX_ registros)",
        "sLengthMenu": "Mostrar _MENU_ registros",
        "sLoadingRecords": "Carregando...",
        "sProcessing": "Processando...",
        "sZeroRecords": "Nenhum registro encontrado",
        "sSearch": "",
        "sSearchPlaceholder": "Pesquisar...",
        "oPaginate": {
          "sNext": "Próximo",
          "sPrevious": "Anterior",
          "sFirst": "Primeiro",
          "sLast": "Último"
        },
        "oAria": {
          "sSortAscending": ": Ordenar colunas de forma ascendente",
          "sSortDescending": ": Ordenar colunas de forma descendente"
        }
      }
    });
  } catch (error) {
    if (error.message && !error.message.includes('Token')) alert('Não foi possível carregar os dados dos artigos.');
  }
}

    function openArticleModal(article = null) {
    $('#articleForm')[0].reset();
    $('#articleId').val('');
    if (article) {
        $('#articleType').val(article.type || 'activity');
        } else {
        $('#articleType').val('activity');
    }

    setTimeout(() => {
        if (easyMDE) {
        easyMDE.toTextArea(); // destrói instância anterior
        easyMDE = null;
        }
        easyMDE = new EasyMDE({
        element: document.getElementById("articleContent"),
        spellChecker: false,
        status: false,
        renderingConfig: {
            singleLineBreaks: true,
            codeSyntaxHighlighting: true
        },
        toolbar: [
            "bold", "italic", "strikethrough", "|",
            "heading", "quote", "unordered-list", "ordered-list", "|",
            "link", "image", "code", "|",
            "preview", "guide"
        ],
        forceSync: true
    });

    if (article) {
      $('#articleModalTitle').text('Editar Artigo');
      $('#articleId').val(article.id);
      $('#articleTitle').val(article.title);
      $('#articleDescription').val(article.description);
      easyMDE.value(article.content || '');
    } else {
      $('#articleModalTitle').text('Adicionar Novo Artigo');
      easyMDE.value('');
    }
  }, 10);

  $('#articleModal').addClass('active');
}


    // --- Event Handlers ---
    
    // Handlers de Colaboradores
    $('#addUserBtn').on('click', () => openUserModal());
    $('#usersTable').on('click', '.edit-btn', function() { openUserModal(usersTable.row($(this).parents('tr')).data()); });
    $('#usersTable').on('click', '.delete-btn', function() {
        userIdToDelete = usersTable.row($(this).parents('tr')).data().id;
        $('#deleteModal .modal-title').text('Confirmar Exclusão de Colaborador');
        $('#deleteModal p').text('Tem a certeza de que deseja excluir este colaborador? Esta ação não pode ser revertida.');
        $('#deleteModal').addClass('active');
    });

    $('#userForm').on('submit', async function(e) {
        e.preventDefault();
        const userId = $('#userId').val();
        const data = { username: $('#username').val(), email: $('#email').val(), role: $('#role').val() };
        const password = $('#password').val();
        if (password) data.password = password;
        const url = userId ? `/api/users?id=${userId}` : '/api/users';
        const method = userId ? 'PUT' : 'POST';
        try {
            const response = await secureFetch(url, { method, body: JSON.stringify(data) });
            if (!response.ok) throw new Error((await response.json()).error || 'Falha ao salvar utilizador.');
            $('#userModal').removeClass('active');
            await loadUsers();
        } catch (error) {
            if (error.message && !error.message.includes('Token')) alert(`Erro: ${error.message}`);
        }
    });

    // Handlers de Artigos (NOVO)
    $('#addArticleBtn').on('click', () => openArticleModal());
    $('#articlesTable').on('click', '.edit-btn', function() { openArticleModal(articlesTable.row($(this).parents('tr')).data()); });
    $('#articlesTable').on('click', '.delete-btn', function() {
        articleIdToDelete = articlesTable.row($(this).parents('tr')).data().id;
        $('#deleteModal .modal-title').text('Confirmar Exclusão de Artigo');
        $('#deleteModal p').text('Tem a certeza de que deseja excluir este artigo? Esta ação não pode ser revertida.');
        $('#deleteModal').addClass('active');
    });

    $('#articleForm').on('submit', async function (e) {
  e.preventDefault();

  if (!easyMDE || !easyMDE.value().trim()) {
    alert("O conteúdo do artigo é obrigatório.");
    return;
  }

  const articleId = $('#articleId').val();
  const data = {
    title: $('#articleTitle').val(),
    description: $('#articleDescription').val(),
    content: easyMDE.value(),
    type: $('#articleType').val()
};

  const url = articleId ? `/api/articles?id=${articleId}` : '/api/articles';
  const method = articleId ? 'PUT' : 'POST';

  try {
    const response = await secureFetch(url, {
      method,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Falha ao salvar o artigo.');
    $('#articleModal').removeClass('active');
    await loadArticles();
  } catch (error) {
    if (error.message && !error.message.includes('Token')) alert(`Erro: ${error.message}`);
  }
});


    // Handler de Exclusão Genérico (ATUALIZADO)
    $('#confirmDeleteBtn').on('click', async function() {
        const currentView = window.location.hash;
        let url, id, successCallback, errorMsg;

        if (currentView.includes('users') && userIdToDelete) {
            url = `/api/users?id=${userIdToDelete}`;
            id = userIdToDelete;
            successCallback = loadUsers;
            errorMsg = 'Não foi possível excluir o utilizador.';
            userIdToDelete = null;
        } else if (currentView.includes('articles') && articleIdToDelete) {
            url = `/api/articles?id=${articleIdToDelete}`;
            id = articleIdToDelete;
            successCallback = loadArticles;
            errorMsg = 'Não foi possível excluir o artigo.';
            articleIdToDelete = null;
        }

        if (url) {
            try {
                const response = await secureFetch(url, { method: 'DELETE' });
                if (!response.ok) throw new Error('Falha ao excluir.');
                $('#deleteModal').removeClass('active');
                await successCallback();
            } catch (error) {
                if (error.message && !error.message.includes('Token')) alert(errorMsg);
            }
        }
    });

    // Handlers para fechar modais
    $('#cancelBtn, #userModal .modal-close-btn').on('click', () => $('#userModal').removeClass('active'));
    $('#articleModal .modal-close-btn').on('click', () => $('#articleModal').removeClass('active'));
    $('#cancelDeleteBtn, #deleteModal .modal-close-btn').on('click', () => $('#deleteModal').removeClass('active'));

    // Inicia a página
    setupAdminPage();
});

// --- Funções Globais para Modais (existentes) ---
window.openSimulationModal = function() { $('#simulationModal').addClass('active'); }
window.closeSimulationModal = function() { $('#simulationModal').removeClass('active'); }
window.openHistoryModal = function() { $('#historyModal').addClass('active'); }
window.closeHistoryModal = function() { $('#historyModal').removeClass('active'); }
