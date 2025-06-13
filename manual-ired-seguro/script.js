document.addEventListener('DOMContentLoaded', function() {
    
    // Seleciona os botões de navegação do Hub
    const ferramentasBtn = document.getElementById('nav-ferramentas');
    const conhecimentoBtn = document.getElementById('nav-conhecimento');
    const atividadesBtn = document.getElementById('nav-atividades');

    // Adiciona um 'escutador' de eventos de clique para cada botão

    if (ferramentasBtn) {
        ferramentasBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Impede que o link recarregue a página
            console.log("Botão 'Ferramentas de IA' clicado. Futuramente, irá para a página de ferramentas.");
            // A lógica para mostrar o dashboard de ferramentas será adicionada aqui.
        });
    }

    if (conhecimentoBtn) {
        conhecimentoBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log("Botão 'Base de Conhecimento' clicado. Futuramente, irá para a base de conhecimento.");
            // A lógica para mostrar a base de conhecimento será adicionada aqui.
        });
    }

    if (atividadesBtn) {
        atividadesBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log("Botão 'Artigos e Atividades' clicado. Futuramente, irá para a página de atividades.");
            // A lógica para mostrar os artigos e atividades será adicionada aqui.
        });
    }

});
