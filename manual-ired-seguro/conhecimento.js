document.addEventListener('DOMContentLoaded', async function () {
    // =========================================================================
    // 1. CONFIGURAÇÃO DO FIREBASE
    // =========================================================================
    
    // ATUALIZADO: Configuração do Firebase com as suas credenciais.
    const firebaseConfig = {
        apiKey: "AIzaSyDyo0ClqZCg8wq3YRq2bCLmpci5UqP2KwA",
        authDomain: "treinamentosac-d3caf.firebaseapp.com",
        projectId: "treinamentosac-d3caf",
        storageBucket: "treinamentosac-d3caf.appspot.com",
        messagingSenderId: "404713938104",
        appId: "1:404713938104:web:96c0b9245150bef8ebe84d",
        measurementId: "G-SY0RBD0E76"
    };

    // --- Inicialização do Firebase ---
    // A declaração da variável mainContent foi movida para depois da inicialização
    // para evitar erros caso a inicialização falhe.
    let mainContent;
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
    } catch (e) {
        mainContent = document.getElementById('kb-main-content');
        console.error("Erro ao inicializar o Firebase. Verifique a sua 'firebaseConfig'.", e);
        if(mainContent) mainContent.innerHTML = "<p><strong>Erro:</strong> Não foi possível conectar à base de dados. Verifique a consola para mais detalhes.</p>";
        return;
    }
    const db = firebase.firestore();

    // =========================================================================
    // 2. SELEÇÃO DE ELEMENTOS DO DOM
    // =========================================================================
    mainContent = document.getElementById('kb-main-content');
    const articleTemplate = document.getElementById('article-template');
    const categoriesTemplate = document.getElementById('categories-template');
    const searchInput = document.getElementById('kb-search-input');
    const pageHeader = document.querySelector('.kb-header');
    const globalBackButton = document.querySelector('body > a.back-button');
    
    // --- Elementos do Modal ---
    // A lógica do modal pode ser adicionada aqui quando necessária.

    // =========================================================================
    // 3. ESTADO DA APLICAÇÃO
    // =========================================================================
    let knowledgeBase = [];
    let allArticles = [];

    // =========================================================================
    // 4. LÓGICA PRINCIPAL
    // =========================================================================

    async function loadData() {
        try {
            const contentCollection = db.collection('content');
            const snapshot = await contentCollection.where('type', '==', 'knowledgeBase').get();

            if (snapshot.empty) {
                console.log('Nenhum documento da Base de Conhecimento encontrado.');
                mainContent.innerHTML = "<p>Nenhum conteúdo encontrado na base de conhecimento.</p>";
                return;
            }

            allArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            knowledgeBase = allArticles.reduce((acc, article) => {
                let category = acc.find(c => c.category === article.category);
                if (!category) {
                    category = { category: article.category, articles: [] };
                    acc.push(category);
                }
                category.articles.push(article);
                return acc;
            }, []);

            checkURLAndRender();

        } catch (err) {
            console.error("Erro ao buscar dados do Firestore:", err);
            mainContent.innerHTML = `<p><strong>Erro ao carregar dados:</strong> ${err.message}</p>`;
        }
    }
    
    function renderCategories(categories = knowledgeBase) {
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
        if (!articleData) { 
            mainContent.innerHTML = '<p>Artigo não encontrado.</p>'; 
            return; 
        }

        try {
            const response = await fetch(`./articles/${articleData.file}`);
            if (!response.ok) throw new Error(`Arquivo '${articleData.file}' não encontrado.`);
            const markdownContent = await response.text();
            
            const converter = new showdown.Converter({ strikethrough: true, tables: true });
            const htmlContent = converter.makeHtml(markdownContent);

            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleData.title;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;

            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            
            mainContent.querySelector('.back-button')?.addEventListener('click', () => window.history.back());
            
            mainContent.querySelector('.tech-assistant-button')?.addEventListener('click', () => {
                const techTopicContent = document.getElementById('tech-topic-content');
                const techAssistantResults = document.getElementById('tech-assistant-results');
                const techAssistantLoader = document.getElementById('tech-assistant-loader');
                const techAssistantModal = document.getElementById('techAssistantModal');

                const topic = `${articleData.title}\n\n${articleData.description}`;
                if(techTopicContent) techTopicContent.textContent = topic;
                if(techAssistantResults) techAssistantResults.style.display = 'none';
                if(techAssistantLoader) techAssistantLoader.style.display = 'none';
                if(techAssistantModal) techAssistantModal.classList.add('visible');
            });

        } catch (error) {
            console.error('Erro ao renderizar o artigo:', error);
            mainContent.innerHTML = `<p><strong>Erro:</strong> ${error.message}.</p>`;
        }
    }
    
    // =========================================================================
    // 5. Funções de Event Listeners e Roteamento
    // =========================================================================
    
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

    function checkURLAndRender() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        if (articleId) {
            if(pageHeader) pageHeader.style.display = 'none';
            if(globalBackButton) globalBackButton.style.display = 'none';
            renderArticle(articleId);
        } else {
            if(pageHeader) pageHeader.style.display = 'block';
            if(globalBackButton) globalBackButton.style.display = 'inline-flex';
            renderCategories();
        }
    }
    
    window.addEventListener('popstate', () => checkURLAndRender());

    // Ponto de entrada da aplicação
    loadData();
});
