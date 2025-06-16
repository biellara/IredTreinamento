document.addEventListener('DOMContentLoaded', async function () {
    // --- Elementos do DOM ---
    const mainContent = document.getElementById('kb-main-content');
    const articleTemplate = document.getElementById('article-template');
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
            checkURLForArticle();
        } catch (err) {
            mainContent.innerHTML = `<p class="text-red-500"><strong>Erro ao carregar dados:</strong> ${err.message}</p>`;
        }
    }

    // --- Funções de Renderização ---
    function renderCategories(categories = knowledgeBase) {
        const categoriesTemplate = document.getElementById('categories-template').content.cloneNode(true);
        const categoriesContainer = categoriesTemplate.querySelector('#categories-container');
        categoriesContainer.innerHTML = '';
        mainContent.innerHTML = '';
        
        categories.forEach(category => {
            if(category.articles.length > 0) {
                 categoriesContainer.appendChild(buildCategorySection(category));
            }
        });

        mainContent.appendChild(categoriesTemplate);
        addCardListeners();
    }

    function buildCategorySection(category) {
        let articlesHTML = category.articles.map(article => `
            <a href="#" class="kb-article-card" data-id="${article.id}">
                <h3 class="kb-article-title">${article.title}</h3>
                <p class="kb-article-desc">${article.description}</p>
            </a>`).join('');

        const section = document.createElement('section');
        section.className = 'mb-12';
        const iconHTML = category.icon ? `<i class="fa ${category.icon} mr-2 text-neutral-700"></i>` : '';
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
            mainContent.querySelector('.article-back-button').addEventListener('click', () => history.back());
            
            // UPDATE: Lógica do botão do assistente
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
    
    // --- Lógica do Assistente Técnico ---
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
            body: JSON.stringify({
                history: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`A API retornou um erro: ${response.status} - ${errorBody}`);
        }

        const result = await response.json();
        console.log("Resposta bruta da API Gemini:", result);

        // Verifica o formato esperado
        if (
            result?.candidates?.[0]?.content?.parts?.[0]?.text
        ) {
            return result.candidates[0].content.parts[0].text;
        } else {
            // Tenta retornar algo genérico ou mostrar no console o conteúdo exato
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
                renderArticle(articleId);
            });
        });
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 3) {
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
        if (e.target === techAssistantModal) techAssistantModal.classList.remove('visible');
    });

    // --- Controle de Navegação e URL ---
    function checkURLForArticle() {
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
        checkURLForArticle();
    });

    // --- Inicialização ---
    loadData();
});
