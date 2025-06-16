document.addEventListener('DOMContentLoaded', function () {

    const knowledgeBase = [
        { category: 'Diagnóstico de Conexão', articles: [ { id: 'analise-sinal', title: 'Análise de Sinais Ópticos (ONU/OLT)', description: 'Como interpretar os níveis de sinal dBm.', file: 'analise-sinal.md' }, { id: 'leds-onu', title: 'Interpretação de LEDs da ONU', description: 'O que significam as luzes POWER, PON, LOS e LAN.', file: 'leds-onu.md' }, { id: 'procedimento-los', title: 'Procedimento para Luz LOS Vermelha', description: 'Passo a passo para quando o cliente está sem sinal óptico.', file: 'procedimento-los.md' } ] },
        { category: 'Rede Local e Wi-Fi', articles: [ { id: 'cabos-rede', title: 'Diferença entre Cabos de Rede', description: 'Impacto dos cabos CAT5 e CAT5e.', file: 'cabos-rede.md' }, { id: 'otimizacao-wifi', title: 'Otimização de Canais Wi-Fi', description: 'Melhores práticas para as redes 2.4GHz e 5GHz.', file: 'otimizacao-wifi.md' } ] }
    ];

    const mainContent = document.getElementById('kb-main-content');
    const categoriesTemplate = document.getElementById('categories-template');
    const articleTemplate = document.getElementById('article-template');
    const converter = new showdown.Converter({ extensions: [calloutExtension] });

    function calloutExtension() { /* ... (código da extensão) ... */ return [{ type: 'output', regex: /<blockquote>\s*<p>\[!(NOTE|WARNING|DANGER)\]/g, replace: function (match, type) { const typeLower = type.toLowerCase(); let iconClass = 'fa-solid fa-circle-info'; if (typeLower === 'warning') iconClass = 'fa-solid fa-triangle-exclamation'; if (typeLower === 'danger') iconClass = 'fa-solid fa-hand'; return `<div class="callout ${typeLower}"><i class="callout-icon ${iconClass}"></i><div class="callout-content">`; } }, { type: 'output', regex: /<\/p>\s*<\/blockquote>/g, replace: '</div></div>' }]; }

    function renderCategories() {
        mainContent.innerHTML = '';
        const templateNode = categoriesTemplate.content.cloneNode(true);
        const categoriesContainer = templateNode.querySelector('#categories-container');
        knowledgeBase.forEach(category => {
            let articlesHTML = '';
            category.articles.forEach(article => {
                articlesHTML += `<a href="#" class="kb-article-card" data-id="${article.id}"><h3 class="kb-article-title">${article.title}</h3><p class="kb-article-desc">${article.description}</p></a>`;
            });
            const categorySection = document.createElement('section');
            categorySection.className = 'mb-12';
            categorySection.innerHTML = `<h2 class="kb-category-title">${category.category}</h2><div class="kb-category-grid">${articlesHTML}</div>`;
            categoriesContainer.appendChild(categorySection);
        });
        mainContent.appendChild(templateNode);
        addCardListeners();
    }

    async function renderArticle(articleId) {
        let articleData = null;
        for (const category of knowledgeBase) {
            articleData = category.articles.find(a => a.id === articleId);
            if (articleData) break;
        }

        if (!articleData) {
            mainContent.innerHTML = '<p>Artigo não encontrado.</p>';
            return;
        }
        
        if (window.location.protocol === 'file:') { /* ... (código de verificação) ... */ }
        try {
            const response = await fetch(`./articles/${articleData.file}`);
            if (!response.ok) throw new Error(`Arquivo não encontrado`);
            const markdownContent = await response.text();
            const htmlContent = converter.makeHtml(markdownContent);
            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleData.title;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;
            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            mainContent.querySelector('.article-back-button').addEventListener('click', renderCategories);
        } catch (error) {
            console.error('Erro ao renderizar o artigo:', error);
            mainContent.innerHTML = `<p class="text-red-500"><strong>Erro:</strong> ${error.message}.</p>`;
        }
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

    checkURLForArticle(); // Verifica a URL ao carregar a página
});
