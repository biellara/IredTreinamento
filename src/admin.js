$(document).ready(function() {
    let usersTable;
    let userIdToDelete = null;
    let usersLoaded = false; // Flag para controlar o carregamento dos utilizadores

    // --- Função Wrapper para Fetch Seguro ---
    // ATUALIZAÇÃO: A função agora tenta ler a mensagem de erro específica da API
    // para fornecer um feedback mais detalhado ao utilizador.
    async function secureFetch(url, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        const response = await fetch(url, config);

        // Se o token expirou ou é inválido, redireciona para o login
        if (response.status === 401) {
            localStorage.removeItem('token'); // Limpa o token inválido
            
            let serverError = 'A sua sessão expirou. Por favor, faça login novamente.';
            try {
                // Tenta extrair a mensagem de erro específica da resposta da API
                const errorJson = await response.json();
                if (errorJson.error) {
                    serverError = `Erro de Autenticação: ${errorJson.error}`;
                }
            } catch (e) {
                // Ignora o erro se não conseguir ler o JSON e usa a mensagem padrão
            }

            alert(serverError);
            window.location.href = '/login.html';
            throw new Error(serverError); 
        }

        return response;
    }


    // --- Funções de Navegação e Setup ---

    async function setupAdminPage() {
        if (!localStorage.getItem('token')) {
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
        $('.view').addClass('hidden');
        $(`#view-${viewName}`).removeClass('hidden');
        $('.sidebar-link').removeClass('active');
        $(`a[href="#${viewName}"]`).addClass('active');
        window.location.hash = viewName;

        if (viewName === 'users' && !usersLoaded) {
            await loadUsers();
            usersLoaded = true;
        }
    }

    // --- Funções de Carregamento de Dados (Atualizadas para usar secureFetch) ---

    async function loadDashboardStats() {
        try {
            const usersResponse = await secureFetch('/api/users');
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                $('#stats-total-users').text(users.length);
            }

            const simsResponse = await secureFetch('/api/getSimulations?view=admin');
            if (simsResponse.ok) {
                const { simulations } = await simsResponse.json();
                $('#stats-total-simulations').text(simulations.length);
                renderSimulationsChart(simulations);
            }
            
            $('#stats-total-quizzes').text('0');

        } catch (error) {
            // Apenas regista o erro no console se não for uma sessão expirada (já tratada)
            if (error.message && !error.message.includes('Erro de Autenticação')) {
                 console.error("Erro ao carregar estatísticas do dashboard:", error);
            }
        }
    }

    async function loadUsers() {
        try {
            const response = await secureFetch('/api/users', { method: 'GET' });

            if (response.status === 403) {
                alert('Acesso negado. Precisa de ser administrador.');
                window.location.href = '/';
                return;
            }
            if (!response.ok) throw new Error('Falha ao carregar utilizadores.');

            const users = await response.json();
            
            if (usersTable) usersTable.destroy();

            usersTable = $('#usersTable').DataTable({
                data: users,
                responsive: true,
                columns: [
                    { data: 'username' }, { data: 'email' }, { data: 'role' },
                    {
                        data: 'id', orderable: false,
                        render: (data) => `
                            <button class="edit-btn text-blue-500 hover:text-blue-700 mr-2" data-id="${data}" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn text-red-500 hover:text-red-700" data-id="${data}" title="Excluir"><i class="fas fa-trash"></i></button>
                        `
                    }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.12.1/i18n/pt-PT.json' }
            });
        } catch (error) {
            if (error.message && !error.message.includes('Erro de Autenticação')) {
                console.error('Erro:', error);
                alert('Não foi possível carregar os dados dos utilizadores.');
            }
        }
    }
    
    function renderSimulationsChart(simulations) {
        const ctx = document.getElementById('simulationsChart').getContext('2d');
        const simulationsByDay = simulations.reduce((acc, sim) => {
            const date = new Date(sim.createdAt).toLocaleDateString('pt-PT');
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const labels = Object.keys(simulationsByDay).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        const data = labels.map(label => simulationsByDay[label]);
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nº de Simulações',
                    data: data,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    // --- Funções dos Modais (sem alterações) ---
    function openUserModal(user = null) {
        $('#userForm')[0].reset();
        if (user) {
            $('#modalTitle').text('Editar Utilizador');
            $('#userId').val(user.id);
            $('#username').val(user.username);
            $('#email').val(user.email).prop('disabled', true);
            $('#role').val(user.role);
            $('#password').prop('required', false);
            $('#passwordHelp').show();
        } else {
            $('#modalTitle').text('Adicionar Novo Utilizador');
            $('#email').prop('disabled', false);
            $('#password').prop('required', true);
            $('#passwordHelp').hide();
        }
        $('#userModal').addClass('active');
    }
    function closeUserModal() { $('#userModal').removeClass('active'); }
    function openDeleteModal(userId) { userIdToDelete = userId; $('#deleteModal').addClass('active'); }
    function closeDeleteModal() { userIdToDelete = null; $('#deleteModal').removeClass('active'); }

    // --- Event Handlers (Atualizados para usar secureFetch) ---

    $('#addUserBtn').on('click', () => openUserModal());
    $('#usersTable tbody').on('click', '.edit-btn', function() {
        const userId = $(this).data('id');
        const user = usersTable.rows().data().toArray().find(u => u.id === userId);
        openUserModal(user);
    });
    $('#usersTable tbody').on('click', '.delete-btn', function() {
        openDeleteModal($(this).data('id'));
    });

    $('#userForm').on('submit', async function(e) {
        e.preventDefault();
        const userId = $('#userId').val();
        const data = {
            username: $('#username').val(),
            email: $('#email').val(),
            password: $('#password').val(),
            role: $('#role').val(),
        };
        if (userId && !data.password) delete data.password;
        const url = userId ? `/api/users?id=${userId}` : '/api/users';
        const method = userId ? 'PUT' : 'POST';

        try {
            const response = await secureFetch(url, {
                method: method,
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao salvar utilizador.');
            }
            closeUserModal();
            await loadUsers();
        } catch (error) {
            if (error.message && !error.message.includes('Erro de Autenticação')) {
                console.error('Erro ao salvar:', error);
                alert(`Erro: ${error.message}`);
            }
        }
    });

    $('#cancelBtn').on('click', closeUserModal);
    $('#cancelDeleteBtn').on('click', closeDeleteModal);

    $('#confirmDeleteBtn').on('click', async function() {
        if (!userIdToDelete) return;
        try {
            const response = await secureFetch(`/api/users?id=${userIdToDelete}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Falha ao excluir utilizador.');
            closeDeleteModal();
            await loadUsers();
        } catch (error) {
            if (error.message && !error.message.includes('Erro de Autenticação')) {
                console.error('Erro ao excluir:', error);
                alert('Não foi possível excluir o utilizador.');
            }
        }
    });

    // Inicia a página
    setupAdminPage();
});
