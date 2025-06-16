document.addEventListener('DOMContentLoaded', function () {

    const activityDatabase = [
        { category: 'Artigos Aprofundados', articles: [ { id: 'arquitetura-pon', title: 'A Arquitetura de uma Rede PON', description: 'Entenda o caminho do sinal da OLT até a ONU do cliente.', file: 'deep-dives/arquitetura-pon.md' }, { id: 'espectro-wifi', title: 'Entendendo o Espectro Wi-Fi', description: 'O "porquê" da troca de canais e as bandas de frequência.', file: 'deep-dives/espectro-wifi.md' } ] },
        { category: 'Módulos de Treinamento', articles: [ { id: 'onboarding-n1', title: 'Onboarding N1: Semana 1', description: 'Conceitos essenciais para novos colaboradores do suporte.', file: 'modulos/onboarding-n1.md' } ] },
        { category: 'Atividades Práticas (Quizzes)', articles: [ { id: 'quiz-leds-onu', title: 'Quiz: LEDs da ONU', description: 'Teste seu conhecimento sobre os indicadores dos equipamentos.', file: 'quizzes/quiz-leds-onu.md' } ] }
    ];

    const mainContent = document.getElementById('activities-main-content');
    const categoriesTemplate = document.getElementById('categories-template');
    const articleTemplate = document.getElementById('article-template');
    const converter = new showdown.Converter({ extensions: [calloutExtension] });

    function calloutExtension() { /* ... (código da extensão) ... */ return [{ type: 'output', regex: /<blockquote>\s*<p>\[!(NOTE|WARNING|DANGER)\]/g, replace: function (match, type) { const typeLower = type.toLowerCase(); let iconClass = 'fa-solid fa-circle-info'; if (typeLower === 'warning') iconClass = 'fa-solid fa-triangle-exclamation'; if (typeLower === 'danger') iconClass = 'fa-solid fa-hand'; return `<div class="callout ${typeLower}"><i class="callout-icon ${iconClass}"></i><div class="callout-content">`; } }, { type: 'output', regex: /<\/p>\s*<\/blockquote>/g, replace: '</div></div>' }]; }

    function renderCategories() {
        mainContent.innerHTML = '';
        const templateNode = categoriesTemplate.content.cloneNode(true);
        const categoriesContainer = templateNode.querySelector('#categories-container');
        activityDatabase.forEach(category => {
            let articlesHTML = '';
            category.articles.forEach(article => {
                articlesHTML += `<a href="#" class="kb-article-card" data-id="${article.id}"><h3 class="kb-article-title">${article.title}</h3><p class="kb-article-desc">${article.description}</p></a>`;
            });
            const categorySection = document.createElement('section');
            categorySection.className = 'mb-12';
            categorySection.innerHTML = `<h2 class="kb-category-title"><i class="fa-solid ${category.icon} mr-3"></i>${category.category}</h2><div class="kb-category-grid">${articlesHTML}</div>`;
            categoriesContainer.appendChild(categorySection);
        });
        mainContent.appendChild(templateNode);
        addCardListeners();
    }

    async function renderArticle(articleId) {
        let articleData = null;
        for (const category of activityDatabase) {
            articleData = category.articles.find(a => a.id === articleId);
            if (articleData) break;
        }
        if (!articleData) { /* ... (código de erro) ... */ }
        
        try {
            const response = await fetch(`./atividades/${articleData.file}`);
            if (!response.ok) throw new Error(`Arquivo não encontrado`);
            const markdownContent = await response.text();
            const htmlContent = converter.makeHtml(markdownContent);
            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleData.title;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;
            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            mainContent.querySelector('.article-back-button').addEventListener('click', renderCategories);
        } catch (error) { /* ... (código de erro) ... */ }
    }
    
    function addCardListeners() {
        document.querySelectorAll('.kb-article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                renderArticle(card.dataset.id);
            });
        });
    }

    // --- LÓGICA DE REDIRECIONAMENTO DA BUSCA ---
    function checkURLForArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        if (articleId) {
            document.querySelector('.kb-header').style.display = 'none'; // Esconde o cabeçalho
            renderArticle(articleId);
        } else {
            renderCategories();
        }
    }

    checkURLForArticle();
});
