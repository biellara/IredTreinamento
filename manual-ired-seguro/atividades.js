document.addEventListener('DOMContentLoaded', function () {

    // --- Elementos do DOM ---
    const mainContent = document.getElementById('activities-main-content');
    const categoriesTemplate = document.getElementById('categories-template');
    const articleTemplate = document.getElementById('article-template');
    
    // --- Elementos do Modal (NOVO) ---
    const techAssistantModal = document.getElementById('techAssistantModal');
    const closeTechAssistantModalBtn = document.getElementById('closeTechAssistantModalBtn');
    const explainForMeBtn = document.getElementById('explainForMeBtn');
    const explainForCustomerBtn = document.getElementById('explainForCustomerBtn');
    const techTopicContent = document.getElementById('tech-topic-content');
    const techAssistantLoader = document.getElementById('tech-assistant-loader');
    const techAssistantResults = document.getElementById('tech-assistant-results');
    const techAssistantOutput = document.getElementById('tech-assistant-output');
    const resultsTitle = techAssistantResults.querySelector('.results-title');

    // --- Dados ---
    let activityDatabase = [];
    let allArticles = [];

    // --- Configuração do Conversor Markdown ---
    const calloutExtension = () => {
        return [{
            type: 'output',
            regex: /<blockquote>\s*<p>\[!(NOTE|WARNING|DANGER)\]/g,
            replace: function (match, type) {
                const typeLower = type.toLowerCase();
                let iconClass = 'fa-solid fa-circle-info';
                if (typeLower === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';
                if (typeLower === 'danger') iconClass = 'fa-solid fa-hand';
                return `<div class="callout ${typeLower}"><i class="callout-icon ${iconClass}"></i><div class="callout-content">`;
            }
        }, {
            type: 'output',
            regex: /<\/p>\s*<\/blockquote>/g,
            replace: '</div></div>'
        }];
    };
    const converter = new showdown.Converter({ extensions: [calloutExtension], strikethrough: true, tables: true });

    // --- Carregamento de Dados ---
    async function loadAndRender() {
        try {
            const response = await fetch('./database.json');
            if(!response.ok) throw new Error('Falha ao carregar a base de dados.');
            const db = await response.json();
            activityDatabase = db.activities;
            allArticles = activityDatabase.flatMap(c => c.articles); // Flatten para busca fácil
            checkURLForArticle();
        } catch (error) {
            console.error("Erro:", error);
            mainContent.innerHTML = `<p class="text-red-500">Não foi possível carregar o conteúdo.</p>`;
        }
    }

    // --- Funções de Renderização ---
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
        const articleData = allArticles.find(a => a.id === articleId);
        if (!articleData) { mainContent.innerHTML = '<p>Artigo não encontrado.</p>'; return; }

        try {
            // Assumindo que os artigos de atividades estão em uma pasta 'articles' como os de conhecimento
            const response = await fetch(`./articles/${articleData.file}`);
            if (!response.ok) throw new Error(`Arquivo não encontrado`);
            const markdownContent = await response.text();
            const htmlContent = converter.makeHtml(markdownContent);
            
            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleData.title;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;
            
            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            mainContent.querySelector('.article-back-button').addEventListener('click', () => history.back());

            // UPDATE: Adicionando lógica para o botão do assistente técnico
            const techButton = mainContent.querySelector('.tech-assistant-button');
            if (techButton) {
                techButton.addEventListener('click', () => {
                    const topic = `${articleData.title}\n\n${articleData.description}`;
                    techTopicContent.textContent = topic;
                    techAssistantResults.classList.add('hidden');
                    techAssistantLoader.style.display = 'none';
                    techAssistantModal.classList.add('visible');
                });
            }

        } catch (error) {
            console.error('Erro ao renderizar o artigo:', error);
            mainContent.innerHTML = `<p class="text-red-500"><strong>Erro:</strong> ${error.message}.</p>`;
        }
    }

    // --- Lógica do Assistente Técnico (NOVO) ---
    async function handleTechAssistant(promptPrefix) {
        const topic = techTopicContent.textContent.trim();
        const fullPrompt = `${promptPrefix}:\n${topic}`;

        techAssistantLoader.style.display = 'block';
        techAssistantResults.classList.add('hidden');

        try {
            const responseText = await callGeminiAPI(fullPrompt);
            techAssistantOutput.innerHTML = converter.makeHtml(responseText);
            resultsTitle.textContent = promptPrefix.split(',')[0];
            techAssistantResults.classList.remove('hidden');
        } catch (err) {
            techAssistantOutput.innerHTML = `<p class="text-red-600 font-semibold">Erro: ${err.message}</p>`;
            resultsTitle.textContent = "Erro";
            techAssistantResults.classList.remove('hidden');
        } finally {
            techAssistantLoader.style.display = 'none';
        }
    }

    async function callGeminiAPI(prompt) {
        const apiEndpoint = '/.netlify/functions/gemini';
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`A API retornou um erro: ${response.status} - ${errorBody}`);
            }
            const result = await response.json();
            if (result.response) return result.response;
            if (result.candidates && result.candidates.length > 0) return result.candidates[0].content.parts[0].text;
            throw new Error("Formato de resposta da API inesperado.");
        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);
            throw error;
        }
    }

    // --- Event Listeners ---
    function addCardListeners() {
        document.querySelectorAll('.kb-article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const articleId = card.dataset.id;
                window.history.pushState({ id: articleId }, '', `?id=${articleId}`);
                renderArticle(articleId);
            });
        });
    }

    // --- Event Listeners do Modal (NOVO) ---
    closeTechAssistantModalBtn.addEventListener('click', () => techAssistantModal.classList.remove('visible'));
    explainForMeBtn.addEventListener('click', () => handleTechAssistant("Explique para mim, de forma técnica e detalhada"));
    explainForCustomerBtn.addEventListener('click', () => handleTechAssistant("Gere uma fala simples e empática para explicar isso a um cliente leigo"));
    techAssistantModal.addEventListener('click', (e) => {
        if (e.target === techAssistantModal) techAssistantModal.classList.remove('visible');
    });

    // --- Controle de Navegação e URL ---
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

    window.addEventListener('popstate', (event) => {
        checkURLForArticle();
    });

    // --- Inicialização ---
    loadAndRender();
});
