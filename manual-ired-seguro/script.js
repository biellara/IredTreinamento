document.addEventListener('DOMContentLoaded', function() {
    
    // Seleciona os botões de navegação do Hub
    const conhecimentoBtn = document.getElementById('nav-conhecimento');
    const atividadesBtn = document.getElementById('nav-atividades');

    // O event listener para o botão "Ferramentas de IA" foi removido.
    // Agora, ele funciona como um link normal, redirecionando para 'ferramentas.html'.

    if (conhecimentoBtn) {
        conhecimentoBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Impede que o link recarregue a página
            alert("A página 'Base de Conhecimento' será construída em breve!");
        });
    }

    if (atividadesBtn) {
        atividadesBtn.addEventListener('click', function(event) {
            event.preventDefault();
            alert("A página 'Artigos e Atividades' será construída em breve!");
        });
    }

});
