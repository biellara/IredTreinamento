$(document).ready(function() {
    let usersTable;
    let userIdToDelete = null;
    let usersLoaded = false;
    let simulationsLoaded = false;
    let simulationsChart;

    // --- Função Wrapper para Fetch Seguro ---
    async function secureFetch(url, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return Promise.reject(new Error('Token não encontrado'));
        }

        const defaultHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };
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
            $('#username-display').text('Utilizador');
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
        const viewTitle = $(`a[href="#${viewName}"] span`).text();
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
                    console.error("ERRO CRÍTICO: A função 'setupSimulationsDashboard' não foi encontrada em dashboard.js. O dashboard não será inicializado.");
                }
            });

        } catch (error) {
            console.error("Erro ao carregar dashboard de simulações:", error);
            $('#view-simulations').html('<p class="text-red-500">Ocorreu um erro ao carregar esta secção.</p>');
        }
    }

    async function loadDashboardStats() {
        try {
            const [usersResponse, simsResponse] = await Promise.all([
                secureFetch('/api/users'),
                secureFetch('/api/getSimulations?view=admin')
            ]);

            if (usersResponse.ok) {
                const users = await usersResponse.json();
                $('#stats-total-users').text(users.length);
            }

            if (simsResponse.ok) {
                const { simulations } = await simsResponse.json();
                $('#stats-total-simulations').text(simulations.length);
                renderSimulationsChart(simulations);
            }
            
            $('#stats-total-quizzes').text('0');

        } catch (error) {
            if (error.message && !error.message.includes('Token')) {
                 console.error("Erro ao carregar estatísticas:", error);
            }
        }
    }

    async function loadUsers() {
        if (typeof $.fn.DataTable !== 'function') {
            console.error("ERRO: DataTables não está carregado.");
            return;
        }

        try {
            const response = await secureFetch('/api/users');
            if (response.status === 403) {
                alert('Acesso negado. Precisa de ser administrador.');
                window.location.href = '/';
                return;
            }
            if (!response.ok) throw new Error('Falha ao carregar utilizadores.');

            const users = await response.json();
            
            if ($.fn.DataTable.isDataTable('#usersTable')) {
                $('#usersTable').DataTable().destroy();
            }

            usersTable = $('#usersTable').DataTable({
                data: users,
                responsive: true,
                columns: [
                    { data: 'username', title: 'Username' }, 
                    { data: 'email', title: 'Email' }, 
                    { data: 'role', title: 'Função' },
                    {
                        data: 'id', title: 'Ações', orderable: false,
                        render: (data) => `
                            <button class="edit-btn" data-id="${data}" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" data-id="${data}" title="Excluir"><i class="fas fa-trash"></i></button>
                        `
                    }
                ],
                language: {
                    "sEmptyTable": "Nenhum registro encontrado", "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros", "sInfoEmpty": "Mostrando 0 até 0 de 0 registros", "sInfoFiltered": "(Filtrados de _MAX_ registros)", "sInfoPostFix": "", "sInfoThousands": ".", "sLengthMenu": "_MENU_ resultados por página", "sLoadingRecords": "Carregando...", "sProcessing": "Processando...", "sZeroRecords": "Nenhum registro encontrado", "sSearch": "Pesquisar", "oPaginate": { "sNext": "Próximo", "sPrevious": "Anterior", "sFirst": "Primeiro", "sLast": "Último" }, "oAria": { "sSortAscending": ": Ordenar colunas de forma ascendente", "sSortDescending": ": Ordenar colunas de forma descendente" }
                }
            });
        } catch (error) {
            if (error.message && !error.message.includes('Token')) {
                console.error('Erro ao carregar utilizadores:', error);
                alert('Não foi possível carregar os dados dos utilizadores.');
            }
        }
    }
    
    function renderSimulationsChart(simulations) {
        if (typeof Chart === 'undefined') {
            console.error("ERRO: Chart.js não está carregado.");
            return;
        }
        const ctx = document.getElementById('simulationsChart').getContext('2d');
        
        const simulationsByDay = simulations.reduce((acc, sim) => {
            if (!sim.createdAt) return acc;
            const date = new Date(sim.createdAt.seconds ? sim.createdAt.seconds * 1000 : sim.createdAt).toLocaleDateString('pt-PT');
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(simulationsByDay).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        const data = labels.map(label => simulationsByDay[label]);

        if(simulationsChart) {
            simulationsChart.destroy();
        }

        simulationsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nº de Simulações',
                    data: data,
                    borderColor: 'var(--brand-red)',
                    backgroundColor: 'rgba(213, 43, 30, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // --- Funções dos Modais ---
    function openUserModal(user = null) {
        $('#userForm')[0].reset();
        $('#userId').val('');
        if (user) {
            $('#modalTitle').text('Editar Colaborador');
            $('#userId').val(user.id);
            $('#username').val(user.username);
            $('#email').val(user.email).prop('disabled', true);
            $('#role').val(user.role);
            $('#password').prop('required', false).attr('placeholder', 'Deixe em branco para não alterar');
            $('#passwordHelp').show();
        } else {
            $('#modalTitle').text('Adicionar Novo Colaborador');
            $('#email').prop('disabled', false);
            $('#password').prop('required', true).attr('placeholder', '');
            $('#passwordHelp').hide();
        }
        $('#userModal').addClass('active');
    }

    function closeModal(modalId) { $(`#${modalId}`).removeClass('active'); }

    function openDeleteModal(userId) {
        userIdToDelete = userId;
        $('#deleteModal').addClass('active');
    }

    // --- Event Handlers ---
    $('#addUserBtn').on('click', () => openUserModal());
    $('#usersTable').on('click', '.edit-btn', function() {
        const user = usersTable.row($(this).parents('tr')).data();
        openUserModal(user);
    });
    $('#usersTable').on('click', '.delete-btn', function() {
        const user = usersTable.row($(this).parents('tr')).data();
        openDeleteModal(user.id);
    });

    $('#userForm').on('submit', async function(e) {
        e.preventDefault();
        const userId = $('#userId').val();
        let data = {
            username: $('#username').val(),
            email: $('#email').val(),
            role: $('#role').val(),
        };
        const password = $('#password').val();
        if (password) data.password = password;

        const url = userId ? `/api/users?id=${userId}` : '/api/users';
        const method = userId ? 'PUT' : 'POST';

        try {
            const response = await secureFetch(url, { method, body: JSON.stringify(data) });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao salvar utilizador.');
            }
            closeModal('userModal');
            await loadUsers();
        } catch (error) {
            if (error.message && !error.message.includes('Token')) {
                alert(`Erro: ${error.message}`);
            }
        }
    });

    $('#cancelBtn').on('click', () => closeModal('userModal'));
    $('#cancelDeleteBtn').on('click', () => closeModal('deleteModal'));

    $('#confirmDeleteBtn').on('click', async function() {
        if (!userIdToDelete) return;
        try {
            const response = await secureFetch(`/api/users?id=${userIdToDelete}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao excluir utilizador.');
            closeModal('deleteModal');
            await loadUsers();
        } catch (error) {
            if (error.message && !error.message.includes('Token')) {
                alert('Não foi possível excluir o utilizador.');
            }
        }
    });

    // Inicia a página
    setupAdminPage();
});

// --- Funções Globais para Modais ---
// CORREÇÃO: Adicionadas as funções que faltavam para o modal de histórico.
// Estas funções agora estão disponíveis globalmente para serem chamadas por dashboard.js.
window.openSimulationModal = function() {
    $('#simulationModal').addClass('active');
}
window.closeSimulationModal = function() {
    $('#simulationModal').removeClass('active');
}
window.openHistoryModal = function() {
    $('#historyModal').addClass('active');
}
window.closeHistoryModal = function() {
    $('#historyModal').removeClass('active');
}
