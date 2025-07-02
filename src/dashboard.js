$(document).ready(function() {
    // Objeto de tradução para o DataTables para evitar erro de CORS
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

    async function setupDashboard() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                $('#simulationsTable').parent().html('<p class="text-center text-red-500 p-10">Acesso negado. Por favor, faça login para continuar.</p>');
                return;
            }

            // AJUSTE: A URL da API foi atualizada para a rota unificada e o parâmetro 'view=admin' foi adicionado
            // para buscar todas as simulações, não apenas as do usuário logado.
            const response = await fetch('/api/getSimulations?view=admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

            const data = await response.json();
            let simulations = data.simulations || [];

            simulations.forEach(sim => {
                if (!sim.user?.username && !sim.username) {
                    console.warn("Simulação sem usuário definido:", sim);
                }
            });

            if (simulations.length === 0) {
                $('#simulationsTable').parent().html('<p class="text-center text-gray-500 p-10">Nenhuma simulação encontrada.</p>');
                return;
            }
            
            populateUserFilter(simulations);

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
                        data: 'username', // Alterado para buscar diretamente o campo 'username'
                        title: 'Usuário', 
                        defaultContent: 'Não informado'
                    },
                    { data: 'scenario', title: 'Cenário', defaultContent: 'Não informado' },
                    {
                        data: null, title: 'Ações', orderable: false, className: 'text-center',
                        render: (data, type, row) => `<button class="btn-details" data-id="${row.id}"><i class="fas fa-eye"></i><span>Detalhes</span></button>`
                    }
                ],
                language: dataTableLanguage
            });

            setupFilters(table);
            setupModal(simulations);

        } catch (error) {
            console.error('Falha ao carregar o dashboard:', error);
            $('#simulationsTable').parent().html('<p class="text-center text-red-500 p-10">Não foi possível carregar os dados.</p>');
        }
    }

    function populateUserFilter(simulations) {
        const userFilter = $('#userFilter');
        userFilter.append('<option value="">Todos os usuários</option>');
        const users = [...new Set(simulations.map(s => s.username).filter(Boolean))];
        users.sort().forEach(user => userFilter.append(`<option value="${user}">${user}</option>`));
    }

    function setupFilters(table) {
        $('#userFilter').on('change', function() {
            table.column(1).search(this.value).draw();
        });

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

    function setupModal(simulations) {
        $('#simulationsTable tbody').on('click', '.btn-details', function() {
            const rowId = $(this).data('id');
            const simulation = simulations.find(s => s.id === rowId);
            if (simulation) {
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
                contentHtml += `<p><strong>Data:</strong> ${date.toLocaleString('pt-BR')}</p>`;
                
                // Seção para o Feedback do Analista
                contentHtml += `<hr>`;
                contentHtml += `<h4>Feedback do Analista QA</h4>`;
                
                if (typeof simulation.feedback === 'string' && !simulation.feedback.startsWith('[')) {
                    contentHtml += `<p>${formatText(simulation.feedback)}</p>`;
                } else {
                    contentHtml += "<p>Feedback não disponível.</p>";
                }

                // Seção para o Histórico da Conversa
                contentHtml += `<hr>`;
                contentHtml += `<h4>Histórico da Simulação</h4>`;
                
                let conversationData = [];
                if (Array.isArray(simulation.chatHistory) && simulation.chatHistory.length > 0) {
                    conversationData = simulation.chatHistory;
                } else if (typeof simulation.feedback === 'string' && simulation.feedback.startsWith('[')) {
                    try {
                        conversationData = JSON.parse(simulation.feedback);
                    } catch (e) {
                        console.error("Erro ao parsear o feedback JSON como histórico:", e);
                        conversationData = [];
                    }
                }

                if (Array.isArray(conversationData) && conversationData.length > 0) {
                    conversationData.forEach(msg => {
                        const speaker = msg.role === 'user' ? 'Atendente' : 'Cliente';
                        const text = msg.parts?.[0]?.text || '';
                        contentHtml += `<p><strong>${speaker}:</strong> ${formatText(text)}</p>`;
                    });
                } else {
                    contentHtml += "<p>Histórico não disponível.</p>";
                }

                $('#modal-body').html(contentHtml);

                const exportContainer = $('#modal-export-buttons');
                exportContainer.empty();
                
                const btnPdf = $('<button class="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"><i class="fas fa-file-pdf text-red-600"></i>Exportar PDF</button>');
                btnPdf.on('click', () => exportToPdf(simulation));
                
                const btnCsv = $('<button class="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"><i class="fas fa-file-csv text-green-600"></i>Exportar CSV</button>');
                btnCsv.on('click', () => exportToCsv(simulation));
                
                exportContainer.append(btnPdf, btnCsv);

                if (window.openSimulationModal) window.openSimulationModal();
            }
        });
    }

    function exportToPdf(simulation) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 15;

        doc.setFontSize(16);
        doc.text(`Detalhes da Simulação - ${simulation.scenario || 'N/A'}`, 10, y);
        y += 10;
        
        doc.setFontSize(11);
        const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
        doc.text(`Data: ${date.toLocaleString('pt-BR')}`, 10, y);
        y += 5;
        doc.text(`Usuário: ${simulation.username || 'N/A'}`, 10, y);
        y += 10;

        // Adiciona Feedback do Analista ao PDF
        doc.setFont(undefined, 'bold');
        doc.text("Feedback do Analista QA:", 10, y);
        y += 7;
        doc.setFont(undefined, 'normal');
        let analystFeedback = 'Não disponível.';
        if (typeof simulation.feedback === 'string' && !simulation.feedback.startsWith('[')) {
            analystFeedback = simulation.feedback;
        }
        const feedbackLines = doc.splitTextToSize(analystFeedback, 180);
        doc.text(feedbackLines, 10, y);
        y += feedbackLines.length * 5 + 10;

        // Adiciona Histórico da Simulação ao PDF
        doc.setFont(undefined, 'bold');
        doc.text("Histórico da Simulação:", 10, y);
        y += 7;
        doc.setFont(undefined, 'normal');

        let conversationData = [];
        if (Array.isArray(simulation.chatHistory) && simulation.chatHistory.length > 0) {
            conversationData = simulation.chatHistory;
        } else if (typeof simulation.feedback === 'string' && simulation.feedback.startsWith('[')) {
            try { conversationData = JSON.parse(simulation.feedback); } catch (e) { /* ignore */ }
        }

        if (Array.isArray(conversationData)) {
            conversationData.forEach(msg => {
                const speaker = msg.role === 'user' ? 'Atendente' : 'Cliente';
                const text = `${speaker}: ${msg.parts?.[0]?.text || ''}`;
                const chatLines = doc.splitTextToSize(text, 180);
                if (y + (chatLines.length * 5) > 280) {
                    doc.addPage();
                    y = 15;
                }
                doc.text(chatLines, 10, y);
                y += chatLines.length * 5 + 5;
            });
        }
        
        doc.save(`simulacao_${simulation.id}.pdf`);
    }

    function exportToCsv(simulation) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Tipo,Mensagem\r\n";
        
        // Adiciona Feedback do Analista ao CSV
        let analystFeedback = 'Não disponível.';
        if (typeof simulation.feedback === 'string' && !simulation.feedback.startsWith('[')) {
            analystFeedback = simulation.feedback;
        }
        const formattedFeedback = `"${analystFeedback.replace(/"/g, '""')}"`;
        csvContent += `Feedback do Analista,${formattedFeedback}\r\n`;
        
        // Adiciona Histórico da Simulação ao CSV
        let conversationData = [];
        if (Array.isArray(simulation.chatHistory) && simulation.chatHistory.length > 0) {
            conversationData = simulation.chatHistory;
        } else if (typeof simulation.feedback === 'string' && simulation.feedback.startsWith('[')) {
            try { conversationData = JSON.parse(simulation.feedback); } catch (e) { /* ignore */ }
        }

        if (Array.isArray(conversationData)) {
            conversationData.forEach(msg => {
                const speaker = msg.role === 'user' ? 'Atendente' : 'Cliente';
                const text = `"${(msg.parts?.[0]?.text || '').replace(/"/g, '""')}"`;
                csvContent += `${speaker},${text}\r\n`;
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

    setupDashboard();
});
