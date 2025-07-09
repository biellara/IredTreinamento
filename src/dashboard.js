function setupSimulationsDashboard() {
    
    const dataTableLanguage = {
        "sEmptyTable": "Nenhum registro encontrado", "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros", "sInfoEmpty": "Mostrando 0 até 0 de 0 registros", "sInfoFiltered": "(Filtrados de _MAX_ registros)", "sInfoPostFix": "", "sInfoThousands": ".", "sLengthMenu": "_MENU_ resultados por página", "sLoadingRecords": "Carregando...", "sProcessing": "Processando...", "sZeroRecords": "Nenhum registro encontrado", "sSearch": "Pesquisar", "oPaginate": { "sNext": "Próximo", "sPrevious": "Anterior", "sFirst": "Primeiro", "sLast": "Último" }, "oAria": { "sSortAscending": ": Ordenar colunas de forma ascendente", "sSortDescending": ": Ordenar colunas de forma descendente" }
    };

    async function setup() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                $('#view-simulations').html('<p class="text-center text-red-500 p-10">Acesso negado.</p>');
                return;
            }

            const response = await fetch('/api/getSimulations?view=admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

            const data = await response.json();
            let simulations = data.simulations || [];

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
                data: simulations,
                responsive: true,
                order: [[0, "desc"]],
                columns: [
                    { 
                        data: 'createdAt', title: 'Data', 
                        render: (data) => {
                            if (!data) return 'N/A';
                            const date = data.seconds ? new Date(data.seconds * 1000) : new Date(data);
                            return date.toLocaleDateString('pt-BR');
                        }
                    },
                    { data: 'username', title: 'Usuário', defaultContent: 'Não informado' },
                    { data: 'scenario', title: 'Cenário', defaultContent: 'Não informado' },
                    {
                        data: null, title: 'Ações', orderable: false, className: 'actions-cell',
                        render: (data, type, row) => `
                            <button class="btn-action btn-feedback" data-id="${row.id}" title="Ver Feedback"><i class="fas fa-comment-dots"></i></button>
                            <button class="btn-action btn-history" data-id="${row.id}" title="Ver Histórico"><i class="fas fa-history"></i></button>
                        `
                    }
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
        $('#userFilter').off('change').on('change', function() {
            table.column(1).search(this.value).draw();
        });

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
                
                // AJUSTE: Removida a div com a classe 'prose'
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

    function setupExportHistoryButtons(simulation) {
    const container = $('#modal-export-history-buttons');
    container.empty();

    const btnPdf = $('<button class="btn btn-secondary">Exportar PDF</button>');
    btnPdf.on('click', () => exportHistoryToPdf(simulation));

    const btnCsv = $('<button class="btn btn-secondary">Exportar CSV</button>');
    btnCsv.on('click', () => exportHistoryToCsv(simulation));

    container.append(btnPdf, btnCsv);
}

    function generateHeaderHtml(simulation) {
        const username = simulation.username || 'Não informado';
        const scenario = simulation.scenario || '-';
        const date = simulation.createdAt?.seconds ? new Date(simulation.createdAt.seconds * 1000) : new Date(simulation.createdAt);
        return `
            <p><strong>Usuário:</strong> ${username}</p>
            <p><strong>Cenário:</strong> ${scenario}</p>
            <p><strong>Data:</strong> ${date.toLocaleString('pt-BR')}</p>
            <hr>
        `;
    }

    function formatText(text) {
    if (typeof text !== 'string') return '';
    const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    return `<div style="line-height: 1.6; margin-bottom: 1rem;">${escapedText}</div>`;
}


    function setupExportButtons(simulation) {
        const exportContainer = $('#simulationModal #modal-export-buttons');
        exportContainer.empty();
        
        const btnPdf = $('<button class="btn btn-secondary">Exportar PDF</button>');
        btnPdf.on('click', () => exportToPdf(simulation));
        
        const btnCsv = $('<button class="btn btn-secondary">Exportar CSV</button>');
        btnCsv.on('click', () => exportToCsv(simulation));
        
        exportContainer.append(btnPdf, btnCsv);
    }

    function exportToPdf(simulation) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const username = simulation.username || 'Desconhecido';
    const scenario = simulation.scenario || '-';
    const date = simulation.createdAt?.seconds
        ? new Date(simulation.createdAt.seconds * 1000)
        : new Date(simulation.createdAt);

    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;
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

    // Forçar quebra por linha usando \n
    const paragraphs = feedback.split('\n');

    paragraphs.forEach(paragraph => {
        const lines = doc.splitTextToSize(paragraph.trim(), 180);
        lines.forEach(line => {
            if (y + lineHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += lineHeight;
        });
        y += lineHeight; // espaço entre parágrafos
    });

    doc.save(`feedback_${username}.pdf`);
}


    function exportToCsv(simulation) {
    const username = simulation.username || 'Desconhecido';
    const scenario = simulation.scenario || '-';
    const date = simulation.createdAt?.seconds
        ? new Date(simulation.createdAt.seconds * 1000)
        : new Date(simulation.createdAt);

    const feedback = typeof simulation.feedback === 'string' ? simulation.feedback.replace(/\n/g, ' ') : 'Não disponível';

    const csvContent = [
        ['Usuário', 'Cenário', 'Data', 'Feedback'],
        [username, scenario, date.toLocaleString('pt-BR'), `"${feedback}"`]
    ]
        .map(row => row.join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_${username}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}


    // Inicia o dashboard de simulações
    setup();
}

function exportHistoryToPdf(simulation) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7;
    let y = margin;

    const username = simulation.username || 'Desconhecido';
    const scenario = simulation.scenario || '-';
    const date = simulation.createdAt?.seconds
        ? new Date(simulation.createdAt.seconds * 1000)
        : new Date(simulation.createdAt);

    // Cabeçalho
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
            if (y + lineHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += lineHeight;
        });

        y += lineHeight; // Espaço entre mensagens
    });

    doc.save(`conversa_${username}.pdf`);
}

function exportHistoryToCsv(simulation) {
    const username = simulation.username || 'Desconhecido';
    const scenario = simulation.scenario || '-';
    const date = simulation.createdAt?.seconds
        ? new Date(simulation.createdAt.seconds * 1000)
        : new Date(simulation.createdAt);

    const chat = Array.isArray(simulation.chatHistory) ? simulation.chatHistory : [];

    const rows = [
        ['Usuário', 'Cenário', 'Data'],
        [username, scenario, date.toLocaleString('pt-BR')],
        [],
        ['Quem', 'Mensagem']
    ];

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
