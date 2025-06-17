document.addEventListener('DOMContentLoaded', async function () {
    // --- Elementos do DOM ---
    const mainContent = document.getElementById('kb-main-content');
    const articleTemplate = document.getElementById('article-template');
    const categoriesTemplate = document.getElementById('categories-template');
    const searchInput = document.getElementById('kb-search-input');

    // --- Elementos do Modal ---
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
    let knowledgeBase = [];
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

    // --- Carregamento Inicial ---
    async function loadData() {
        try {
            const response = await fetch('./database.json');
            if (!response.ok) throw new Error('Não foi possível carregar a base de dados.');
            const data = await response.json();
            knowledgeBase = data.knowledgeBase || [];
            allArticles = knowledgeBase.flatMap(c => c.articles.map(a => ({...a, category: c.category})));
            checkURLAndRender();
        } catch (err) {
            mainContent.innerHTML = `<p><strong>Erro ao carregar dados:</strong> ${err.message}</p>`;
        }
    }

    // --- Funções de Renderização ---
    function renderCategories(categories = knowledgeBase) {
        const templateNode = categoriesTemplate.content.cloneNode(true);
        const categoriesContainer = templateNode.querySelector('#categories-container');
        categoriesContainer.innerHTML = ''; // Limpa o container
        mainContent.innerHTML = ''; // Limpa o conteúdo principal
        
        categories.forEach(category => {
            if(category.articles.length > 0) {
                 categoriesContainer.appendChild(buildCategorySection(category));
            }
        });

        mainContent.appendChild(templateNode);
        addCardListeners();
    }

    function buildCategorySection(category) {
        let articlesHTML = category.articles.map(article => `
            <a href="#" class="kb-article-card" data-id="${article.id}">
                <h3 class="kb-article-title">${article.title}</h3>
                <p class="kb-article-desc">${article.description}</p>
            </a>`).join('');

        const section = document.createElement('section');
        const iconHTML = category.icon ? `<i class="fa-solid ${category.icon}"></i>` : '';
        section.innerHTML = `
            <h2 class="kb-category-title">${iconHTML}${category.category}</h2>
            <div class="kb-category-grid">${articlesHTML}</div>`;
        return section;
    }

    async function renderArticle(articleId) {
        const articleData = allArticles.find(a => a.id === articleId);

        if (!articleData) {
            mainContent.innerHTML = '<p>Artigo não encontrado.</p>';
            return;
        }

        try {
            const response = await fetch(`./articles/${articleData.file}`);
            if (!response.ok) throw new Error(`Arquivo '${articleData.file}' não encontrado.`);
            const markdownContent = await response.text();
            const htmlContent = converter.makeHtml(markdownContent);

            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleData.title;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;

            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            
            mainContent.querySelector('.article-back-button').addEventListener('click', () => window.history.back());
            
            const techButton = mainContent.querySelector('.tech-assistant-button');
            if (techButton) {
                techButton.addEventListener('click', () => {
                    const topic = `${articleData.title}\n\n${articleData.description}`;
                    techTopicContent.textContent = topic;
                    techAssistantResults.style.display = 'none';
                    techAssistantLoader.style.display = 'none';
                    techAssistantModal.classList.add('visible');
                });
            }
        } catch (error) {
            console.error('Erro ao renderizar o artigo:', error);
            mainContent.innerHTML = `<p><strong>Erro:</strong> ${error.message}.</p>`;
        }
    }
    
    // --- Lógica do Assistente Técnico ---
    async function handleTechAssistant(promptPrefix) {
        const topic = techTopicContent.textContent.trim();
        if (!topic) return;

        const fullPrompt = `${promptPrefix}:\n${topic}`;

        techAssistantLoader.style.display = 'block';
        techAssistantResults.style.display = 'none';

        try {
            const responseText = await callGeminiAPI(fullPrompt);
            techAssistantOutput.innerHTML = converter.makeHtml(responseText);
            if (resultsTitle) resultsTitle.textContent = promptPrefix.split(',')[0];
            techAssistantResults.style.display = 'block';
        } catch (err) {
            techAssistantOutput.innerHTML = `<p style="color: var(--brand-red);"><strong>Erro:</strong> ${err.message}</p>`;
            if (resultsTitle) resultsTitle.textContent = "Erro";
            techAssistantResults.style.display = 'block';
        } finally {
            techAssistantLoader.style.display = 'none';
        }
    }

    // UPDATE: Função atualizada para corresponder ao novo backend gemini.js
    async function callGeminiAPI(prompt) {
        const apiEndpoint = '/.netlify/functions/gemini';
        try {
            // O corpo da requisição agora envia um objeto `contents`
            const payload = {
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }]
            };

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`A API retornou um erro: ${response.status} - ${errorBody}`);
            }

            const result = await response.json();
            
            // O backend agora retorna a resposta completa da API Gemini.
            // O caminho para o texto é dentro de 'candidates'.
            if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Resposta inesperada da API:", result);
                throw new Error("Formato de resposta da API inesperado.");
            }
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
                checkURLAndRender();
            });
        });
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm.length < 2) {
            renderCategories();
            return;
        }
        const filteredArticles = allArticles.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.description.toLowerCase().includes(searchTerm)
        );
        const filteredCategories = knowledgeBase.map(category => ({
            ...category,
            articles: category.articles.filter(article => filteredArticles.some(fa => fa.id === article.id))
        })).filter(category => category.articles.length > 0);
        
        renderCategories(filteredCategories);
    });

    closeTechAssistantModalBtn.addEventListener('click', () => techAssistantModal.classList.remove('visible'));
    explainForMeBtn.addEventListener('click', () => handleTechAssistant("Explique para mim, de forma técnica e detalhada"));
    explainForCustomerBtn.addEventListener('click', () => handleTechAssistant("Gere uma fala simples e empática para explicar isso a um cliente leigo"));
    
    techAssistantModal.addEventListener('click', (e) => {
        if (e.target === techAssistantModal) {
            techAssistantModal.classList.remove('visible');
        }
    });

    // --- Roteamento e Inicialização ---
    function checkURLAndRender() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        const header = document.querySelector('.kb-header');

        if (articleId) {
            if (header) header.style.display = 'none';
            renderArticle(articleId);
        } else {
            if (header) header.style.display = 'block';
            renderCategories();
        }
    }
    
    window.addEventListener('popstate', (event) => {
        checkURLAndRender();
    });

    // --- Ponto de Entrada ---
    loadData();
});
