document.addEventListener('DOMContentLoaded', function () {

    let activityDatabase = [];
    const mainContent = document.getElementById('activities-main-content');
    const categoriesTemplate = document.getElementById('categories-template');
    const articleTemplate = document.getElementById('article-template');
    const converter = new showdown.Converter();

    async function loadAndRender() {
        try {
            const response = await fetch('./database.json');
            if(!response.ok) throw new Error('Falha ao carregar a base de dados.');
            const db = await response.json();
            activityDatabase = db.activities;
            checkURLForArticle();
        } catch (error) {
            console.error("Erro:", error);
            mainContent.innerHTML = `<p class="text-red-500">Não foi possível carregar o conteúdo.</p>`;
        }
    }

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
        if (!articleData) { mainContent.innerHTML = '<p>Artigo não encontrado.</p>'; return; }

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

    loadAndRender();
});
