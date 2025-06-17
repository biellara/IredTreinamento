document.addEventListener('DOMContentLoaded', async function () {
    // =========================================================================
    // 1. SELEÇÃO DE ELEMENTOS DO DOM
    // =========================================================================
    const mainContent = document.getElementById('activities-main-content');
    const articleTemplate = document.getElementById('article-template');
    const categoriesTemplate = document.getElementById('categories-template');
    const searchInput = document.getElementById('activities-search-input');
    const pageHeader = document.querySelector('.kb-header');
    const globalBackButton = document.querySelector('body > a.back-button');

    // Elementos do Modal
    const techAssistantModal = document.getElementById('techAssistantModal');
    const closeTechAssistantModalBtn = document.getElementById('closeTechAssistantModalBtn');
    const explainForMeBtn = document.getElementById('explainForMeBtn');
    const explainForCustomerBtn = document.getElementById('explainForCustomerBtn');
    const techTopicContent = document.getElementById('tech-topic-content');
    const techAssistantLoader = document.getElementById('tech-assistant-loader');
    const techAssistantResults = document.getElementById('tech-assistant-results');
    const techAssistantOutput = document.getElementById('tech-assistant-output');
    const resultsTitle = techAssistantResults.querySelector('.results-title');

    // =========================================================================
    // 2. ESTADO DA APLICAÇÃO
    // =========================================================================
    let activityDatabase = [];
    let allArticles = [];

    // =========================================================================
    // 3. CONFIGURAÇÕES
    // =========================================================================
    const converter = new showdown.Converter({
        extensions: [() => [{
            type: 'output',
            regex: /<blockquote>\s*<p>\[!(NOTE|WARNING|DANGER)\]/g,
            replace: (match, type) => {
                const lType = type.toLowerCase();
                const icon = lType === 'warning' ? 'fa-triangle-exclamation' : lType === 'danger' ? 'fa-hand' : 'fa-circle-info';
                return `<div class="callout ${lType}"><i class="callout-icon fa-solid ${icon}"></i><div class="callout-content">`;
            }
        }, { type: 'output', regex: /<\/p>\s*<\/blockquote>/g, replace: '</div></div>' }]],
        strikethrough: true, tables: true
    });

    // =========================================================================
    // 4. LÓGICA PRINCIPAL
    // =========================================================================

    async function loadData() {
        try {
            const response = await fetch('./database.json');
            if (!response.ok) throw new Error('Não foi possível carregar a base de dados.');
            const data = await response.json();
            activityDatabase = data.activities || [];
            allArticles = activityDatabase.flatMap(c => c.articles.map(a => ({...a, categoryName: c.category})));
            checkURLAndRender();
        } catch (err) {
            mainContent.innerHTML = `<p><strong>Erro ao carregar dados:</strong> ${err.message}</p>`;
        }
    }

    function renderCategories(categories = activityDatabase) {
        const templateNode = categoriesTemplate.content.cloneNode(true);
        const categoriesContainer = templateNode.querySelector('#categories-container');
        categoriesContainer.innerHTML = '';
        mainContent.innerHTML = '';
        
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
        section.innerHTML = `<h2 class="kb-category-title">${iconHTML}${category.category}</h2><div class="kb-category-grid">${articlesHTML}</div>`;
        return section;
    }

    async function renderArticle(articleId) {
        const articleData = allArticles.find(a => a.id === articleId);
        if (!articleData) { mainContent.innerHTML = '<p>Artigo não encontrado.</p>'; return; }

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
            
            mainContent.querySelector('.back-button').addEventListener('click', () => window.history.back());
            
            mainContent.querySelector('.tech-assistant-button')?.addEventListener('click', () => {
                const topic = `${articleData.title}\n\n${articleData.description}`;
                techTopicContent.textContent = topic;
                techAssistantResults.style.display = 'none';
                techAssistantLoader.style.display = 'none';
                techAssistantModal.classList.add('visible');
            });

        } catch (error) {
            console.error('Erro ao renderizar o artigo:', error);
            mainContent.innerHTML = `<p><strong>Erro:</strong> ${error.message}.</p>`;
        }
    }
    
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

    async function callGeminiAPI(prompt) {
        const apiEndpoint = '/.netlify/functions/gemini';
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
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
            if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            }
            throw new Error("Formato de resposta da API inesperado.");
        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);
            throw error;
        }
    }

    // =========================================================================
    // 5. EVENT LISTENERS
    // =========================================================================

    function addCardListeners() {
        document.querySelectorAll('.kb-article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const articleId = card.dataset.id;
                const articleData = allArticles.find(a => a.id === articleId);

                if (articleData && articleData.categoryName.toLowerCase().includes('quiz')) {
                    window.location.href = `quiz.html?id=${articleId}`;
                } else {
                    window.history.pushState({ id: articleId }, '', `?id=${articleId}`);
                    checkURLAndRender();
                }
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
        const filteredCategories = activityDatabase.map(category => ({
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

    // =========================================================================
    // 6. INICIALIZAÇÃO E ROTEAMENTO
    // =========================================================================
    
    /**
     * ATUALIZADO: Esta função agora verifica se o ID na URL é de um quiz
     * antes de tentar renderizar um artigo.
     */
    function checkURLAndRender() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        if (articleId) {
            const articleData = allArticles.find(a => a.id === articleId);

            // Se o ID na URL for de um quiz, redireciona para a página correta.
            if (articleData && articleData.categoryName.toLowerCase().includes('quiz')) {
                window.location.href = `quiz.html?id=${articleId}`;
                return; // Impede a execução do resto da função.
            }

            // Se for um artigo normal, esconde os elementos da página e renderiza.
            if(pageHeader) pageHeader.style.display = 'none';
            if(globalBackButton) globalBackButton.style.display = 'none';
            renderArticle(articleId);
        } else {
            // Se não houver ID, mostra a lista de categorias.
            if(pageHeader) pageHeader.style.display = 'block';
            if(globalBackButton) globalBackButton.style.display = 'inline-flex';
            renderCategories();
        }
    }
    
    window.addEventListener('popstate', () => checkURLAndRender());

    loadData();
});
