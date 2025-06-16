document.addEventListener('DOMContentLoaded', function () {

    const knowledgeBase = [
        {
            category: 'Diagnóstico de Conexão',
            articles: [
                { id: 'analise-sinal', title: 'Análise de Sinais Ópticos (ONU/OLT)', description: 'Como interpretar os níveis de sinal dBm para diagnosticar problemas.', file: 'analise-sinal.md' },
                { id: 'leds-onu', title: 'Interpretação de LEDs da ONU', description: 'O que significam as luzes POWER, PON, LOS e LAN.', file: 'leds-onu.md' },
                { id: 'procedimento-los', title: 'Procedimento para Luz LOS Vermelha', description: 'Passo a passo para quando o cliente está sem sinal óptico.', file: 'procedimento-los.md' },
                { id: 'falha-massiva', title: 'Verificação de Falhas Massivas', description: 'Como identificar se o problema afeta uma região inteira.', file: 'falha-massiva.md' },
            ]
        },
        {
            category: 'Rede Local e Wi-Fi',
            articles: [
                { id: 'cabos-rede', title: 'Diferença entre Cabos de Rede', description: 'Impacto dos cabos CAT5 e CAT5e na velocidade contratada.', file: 'cabos-rede.md' },
                { id: 'canais-wifi', title: 'Otimização de Canais Wi-Fi', description: 'Melhores práticas para as redes 2.4GHz e 5GHz.', file: 'canais-wifi.md' },
            ]
        }
    ];

    const mainContent = document.getElementById('kb-main-content');
    const categoriesTemplate = document.getElementById('categories-template');
    const articleTemplate = document.getElementById('article-template');
    const converter = new showdown.Converter(); 

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
        
        try {
            const response = await fetch(`./articles/${articleData.file}`);
            if (!response.ok) throw new Error(`Arquivo '${articleData.file}' não encontrado`);
            const markdownContent = await response.text();
            const htmlContent = converter.makeHtml(markdownContent);
            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleData.title;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;
            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            mainContent.querySelector('.article-back-button').addEventListener('click', checkURLForArticle);
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

    function checkURLForArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        const header = document.querySelector('.kb-header');

        if (articleId) {
            if(header) header.style.display = 'none';
            renderArticle(articleId);
        } else {
            if(header) header.style.display = 'block';
            renderCategories();
        }
    }

    checkURLForArticle();
});
