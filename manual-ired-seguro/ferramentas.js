document.addEventListener('DOMContentLoaded', function() {
    
    // Lógica de Navegação da página de Ferramentas
    const toolLinks = document.querySelectorAll('.sidebar-link');
    const toolViews = document.querySelectorAll('.view');

    function switchToolView(targetId) {
        toolViews.forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.add('active');
        }

        toolLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.target === targetId);
        });
    }

    toolLinks.forEach(link => {
        // Não adiciona listener para o link de 'Voltar'
        if (link.getAttribute('href') === 'index.html') return;

        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.dataset.target;
            if (targetId) {
                switchToolView(targetId);
            }
        });
    });

    // --- A lógica das ferramentas de IA será adicionada aqui ---

});
