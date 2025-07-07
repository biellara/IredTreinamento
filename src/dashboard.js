/**
 * Configura e inicializa o dashboard de simulações.
 * Busca os dados da API, popula a tabela e configura os filtros e interações.
 */
function setupSimulationsDashboard() {
    // =================================================================================
    // CORREÇÃO PRINCIPAL: Verificação de Dependência
    // Antes de executar qualquer código, verificamos se a biblioteca DataTables foi
    // carregada corretamente. Se não foi, exibimos um erro claro e paramos a execução.
    // =================================================================================
    if (typeof $.fn.DataTable !== 'function') {
        console.error("ERRO CRÍTICO EM dashboard.js: A biblioteca DataTables não está carregada. Verifique a ordem dos scripts no seu arquivo HTML principal (ex: admin.html). A ordem correta é: 1. jQuery, 2. DataTables.js, 3. admin.js.");
        // Informa o usuário na interface que houve um problema de configuração.
        $('#view-simulations').html('<p class="text-center text-red-500 p-10">Erro de configuração. A biblioteca de tabelas (DataTables) não foi encontrada.</p>');
        return; // Impede que o resto do script seja executado, evitando o erro.
    }

    // Objeto de tradução para o DataTables para evitar erros de CORS e melhorar a UX.
    const dataTableLanguage = {
        "sEmptyTable": "Nenhum registro encontrado",
        "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
        "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
        "sInfoFiltered": "(Filtrados de _MAX_ registros)",
        "sInfoPostFix": "",
        "sInfoThousands": ".",
        "sLengthMenu": "_MENU_ resultados por página",
        "sLoadingRecords": "Carregando...",
        "sProcessing": "Processando...",
        "sZeroRecords": "Nenhum registro encontrado",
        "sSearch": "Pesquisar",
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
    };

    /**
     * Função principal que busca dados e monta a tabela.
     */
    async function setupDashboard() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                $('#view-simulations').html('<p class="text-center text-red-500 p-10">Acesso negado. Por favor, faça login para continuar.</p>');
                return;
            }

            const response = await fetch('/api/getSimulations?view=admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}`);
            }

            const data = await response.json();
            const simulations = data.simulations || [];

            if (simulations.length === 0) {
                $('#view-simulations #simulationsTable').parent().html('<p class="text-center text-gray-500 p-10">Nenhuma simulação encontrada.</p>');
                return;
            }
            
            populateUserFilter(simulations);

            // Esta verificação agora é segura porque já confirmamos que DataTable existe.
            if ($.fn.DataTable.isDataTable('#simulationsTable')) {
                $('#simulationsTable').DataTable().destroy();
            }
            $('#simulationsTable tbody').empty();

            const table = $('#simulationsTable').DataTable({
                data: simulations,
                responsive: true,
                order: [[0, "desc"]],
                columns: [
                    { 
                        data: 'createdAt', 
                        title: 'Data', 
                        render: (data) => {
                            if (!data) return 'N/A';
                            const date = data.seconds ? new Date(data.seconds * 1000) : new Date(data);
                            return date.toLocaleDateString('pt-BR');
                        }
                    },
                    { 
                        data: 'username',
                        title: 'Usuário', 
                        defaultContent: 'Não informado'
                    },
                    { data: 'scenario', title: 'Cenário', defaultContent: 'Não informado' },
                    {
                        data: null, 
                        title: 'Ações', 
                        orderable: false, 
                        className: 'text-center',
                        render: (data, type, row) => `<button class="btn-details" data-id="${row.id}"><i class="fas fa-eye"></i><span>Detalhes</span></button>`
                    }
                ],
                language: dataTableLanguage
            });

            setupFilters(table);
            setupModal(simulations);

        } catch (error) {
            console.error('Falha ao carregar o dashboard de simulações:', error);
            $('#view-simulations').html('<p class="text-center text-red-500 p-10">Não foi possível carregar os dados.</p>');
        }
    }

    /**
     * Popula o filtro de usuários com valores únicos.
     */
    function populateUserFilter(simulations) {
        const userFilter = $('#userFilter');
        userFilter.empty().append('<option value="">Todos os usuários</option>');
        const users = [...new Set(simulations.map(s => s.username).filter(Boolean))];
        users.sort().forEach(user => userFilter.append(`<option value="${user}">${user}</option>`));
    }

    /**
     * Configura os listeners de evento para os filtros da tabela.
     */
    function setupFilters(table) {
        $('#userFilter').on('change', function() {
            table.column(1).search(this.value).draw();
        });

        // Verificação de segurança adicional para a biblioteca flatpickr
        if (typeof flatpickr === 'undefined') {
            console.error("Aviso: A biblioteca 'flatpickr' não foi encontrada. O filtro de data não funcionará.");
            return;
        }

        if (!document.querySelector("#dateRange")._flatpickr) {
            flatpickr("#dateRange", {
                mode: "range",
                dateFormat: "d/m/Y",
                altInput: true,
                altFormat: "d/m/Y",
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

    /**
     * Configura o modal de detalhes usando delegação de eventos.
     */
    function setupModal(simulations) {
        $('#view-simulations').off('click', '.btn-details').on('click', '.btn-details', function() {
            const rowId = $(this).data('id');
            const simulation = simulations.find(s => s.id === rowId);

            if (simulation) {
                // ... (O restante do código do modal permanece o mesmo) ...
                let contentHtml = '';
                const username = simulation.username || 'Não informado';
                const scenario = simulation.scenario || '-';
                const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
                
                const formatText = (text) => {
                    if (typeof text !== 'string') return '';
                    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                               .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                };

                contentHtml += `<p><strong>Usuário:</strong> ${username}</p>`;
                contentHtml += `<p><strong>Cenário:</strong> ${scenario}</p>`;
                contentHtml += `<p><strong>Data:</strong> ${date.toLocaleString('pt-BR')}</p><hr>`;
                contentHtml += `<h4>Feedback do Analista QA</h4>`;
                
                if (typeof simulation.feedback === 'string' && !simulation.feedback.startsWith('[')) {
                    contentHtml += `<div class="prose">${formatText(simulation.feedback)}</div>`;
                } else {
                    contentHtml += "<p>Feedback não disponível.</p>";
                }

                contentHtml += `<hr><h4>Histórico da Simulação</h4>`;
                
                let conversationData = [];
                if (Array.isArray(simulation.chatHistory) && simulation.chatHistory.length > 0) {
                    conversationData = simulation.chatHistory;
                } else if (typeof simulation.feedback === 'string' && simulation.feedback.startsWith('[')) {
                    try { conversationData = JSON.parse(simulation.feedback); } catch (e) {}
                }

                if (conversationData.length > 0) {
                    conversationData.forEach(msg => {
                        if (msg.role !== 'user' && msg.role !== 'model') return;
                        const speaker = msg.role === 'user' ? 'Atendente' : 'Cliente';
                        const text = msg.parts?.[0]?.text || '';
                        contentHtml += `<p><strong>${speaker}:</strong> ${formatText(text)}</p>`;
                    });
                } else {
                    contentHtml += "<p>Histórico não disponível.</p>";
                }

                $('#simulationModal #modal-body').html(contentHtml);
                const exportContainer = $('#simulationModal #modal-export-buttons');
                exportContainer.empty();
                
                const btnPdf = $('<button class="btn btn-secondary">Exportar PDF</button>');
                btnPdf.on('click', () => exportToPdf(simulation));
                
                const btnCsv = $('<button class="btn btn-secondary">Exportar CSV</button>');
                btnCsv.on('click', () => exportToCsv(simulation));
                
                exportContainer.append(btnPdf, btnCsv);

                if (window.openSimulationModal) {
                    window.openSimulationModal();
                }
            }
        });
    }

    /**
     * Exporta os detalhes da simulação para PDF.
     */
    function exportToPdf(simulation) {
        // Verificação de segurança para a biblioteca jsPDF
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.error("Aviso: A biblioteca 'jsPDF' não foi encontrada. A exportação para PDF não funcionará.");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text(`Detalhes da Simulação - ID: ${simulation.id}`, 10, 10);
        doc.text(`Usuário: ${simulation.username || 'N/A'}`, 10, 20);
        
        doc.save(`simulacao_${simulation.id}.pdf`);
    }

    /**
     * Exporta o histórico da conversa para CSV.
     */
    function exportToCsv(simulation) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Role,Message\r\n";

        if (Array.isArray(simulation.chatHistory)) {
            simulation.chatHistory.forEach(entry => {
                const role = entry.role ? entry.role.replace(/"/g, '""') : '';
                const text = entry.parts?.[0]?.text ? entry.parts[0].text.replace(/"/g, '""') : '';
                csvContent += `"${role}","${text}"\r\n`;
            });
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `simulacao_${simulation.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Inicia o processo de configuração do dashboard.
    setupDashboard();
}