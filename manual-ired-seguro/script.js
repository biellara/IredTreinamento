document.addEventListener('DOMContentLoaded', function() {
    
    // Seleciona todos os elementos clicáveis que mudam a visualização
    const navLinks = document.querySelectorAll('.sidebar-link, .hub-button, .tool-card');
    const views = document.querySelectorAll('.view');

    // Função central para trocar de visualização
    function switchView(targetId) {
        // Esconde todas as views
        views.forEach(view => {
            view.classList.remove('active');
        });

        // Mostra a view alvo
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.add('active');
        } else {
            console.error(`View com id "${targetId}" não foi encontrada.`);
            return;
        }

        // Atualiza o estado 'active' nos links da sidebar
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const linkTarget = link.dataset.target;
            
            // Lógica para destacar o link pai (ex: Ferramentas de IA) mesmo quando uma sub-página (ex: Diagnóstico) está ativa.
            const isParentActive = (targetId.startsWith('view-diagnostico') || targetId.startsWith('view-simulador') || targetId.startsWith('view-relatorio')) && linkTarget === 'view-ferramentas';

            if (linkTarget === targetId || isParentActive) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Adiciona o 'escutador' de eventos para todos os links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            const targetId = this.dataset.target;
            if (targetId) {
                switchView(targetId);
            }
        });
    });

    // --- (As funções de IA de diagnóstico, simulação e relatório serão reintegradas aqui na próxima etapa) ---

});
