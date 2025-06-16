document.addEventListener('DOMContentLoaded', function () {

    const activityDatabase = [
        {
            category: 'Artigos Aprofundados',
            icon: 'fa-microscope',
            articles: [
                { id: 'arquitetura-pon', title: 'A Arquitetura de uma Rede PON', description: 'Entenda o caminho do sinal da OLT até a ONU do cliente.', file: 'deep-dives/arquitetura-pon.md' },
                { id: 'espectro-wifi', title: 'Entendendo o Espectro Wi-Fi', description: 'O "porquê" da troca de canais e as bandas de frequência.', file: 'deep-dives/espectro-wifi.md' }
            ]
        },
        {
            category: 'Módulos de Treinamento',
            icon: 'fa-graduation-cap',
            articles: [
                { id: 'onboarding-n1', title: 'Onboarding N1: Semana 1', description: 'Conceitos essenciais para novos colaboradores do suporte.', file: 'modulos/onboarding-n1.md' }
            ]
        },
        {
            category: 'Atividades Práticas (Quizzes)',
            icon: 'fa-vial-circle-check',
            articles: [
                { id: 'quiz-leds-onu', title: 'Quiz: LEDs da ONU', description: 'Teste seu conhecimento sobre os indicadores dos equipamentos.', file: 'quizzes/quiz-leds-onu.md' }
            ]
        }
    ];

    const mainContent = document.getElementById('activities-main-content');
    const categoriesTemplate = document.getElementById('categories-template');
    const articleTemplate = document.getElementById('article-template');

    const converter = new showdown.Converter({
        extensions: [calloutExtension]
    });

    function calloutExtension() {
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
    }

    function renderCategories() {
        mainContent.innerHTML = '';
        const templateNode = categoriesTemplate.content.cloneNode(true);
        const categoriesContainer = templateNode.getElementById('categories-container');

        activityDatabase.forEach(category => {
            const section = document.createElement('section');
            section.className = 'mb-12';

            let articlesHTML = '';
            category.articles.forEach(article => {
                articlesHTML += `
                    <a href="#" class="kb-article-card" data-id="${article.id}" data-file="${article.file}" data-title="${article.title}">
                        <h3 class="kb-article-title">${article.title}</h3>
                        <p class="kb-article-desc">${article.description}</p>
                    </a>
                `;
            });

            section.innerHTML = `
                <h2 class="kb-category-title"><i class="fa-solid ${category.icon} mr-3"></i>${category.category}</h2>
                <div class="kb-category-grid">${articlesHTML}</div>
            `;
            categoriesContainer.appendChild(section);
        });

        mainContent.appendChild(templateNode);
        addCardListeners();
    }

    async function renderArticle(articleIdOrFile, title = null) {
        let articleData = null;

        // Suporta tanto busca por ID (via URL) quanto por file (via click)
        if (articleIdOrFile.endsWith('.md')) {
            articleData = { file: articleIdOrFile, title };
        } else {
            for (const category of activityDatabase) {
                const found = category.articles.find(a => a.id === articleIdOrFile);
                if (found) {
                    articleData = found;
                    break;
                }
            }
        }

        if (!articleData) {
            mainContent.innerHTML = '<p>Artigo não encontrado.</p>';
            return;
        }

        if (window.location.protocol === 'file:') {
            mainContent.innerHTML = `<div class="callout danger"><i class="callout-icon fa-solid fa-triangle-exclamation"></i><div class="callout-content"><p><strong>Erro de Carregamento:</strong> Para testar o projeto, você precisa usar um servidor local (http-server).</p></div></div>`;
            return;
        }

        try {
            const response = await fetch(`./atividades/${articleData.file}`);
            if (!response.ok) throw new Error(`Arquivo não encontrado (Status: ${response.status})`);
            const markdownContent = await response.text();
            const htmlContent = converter.makeHtml(markdownContent);

            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleData.title;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;

            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            mainContent.querySelector('.article-back-button').addEventListener('click', () => {
                history.pushState({}, '', window.location.pathname);
                document.querySelector('.kb-header').style.display = 'block';
                renderCategories();
            });
        } catch (error) {
            console.error('Erro ao renderizar o artigo:', error);
            mainContent.innerHTML = `<p class="text-red-500"><strong>Erro:</strong> ${error.message}.</p>`;
        }
    }

    function addCardListeners() {
        document.querySelectorAll('.kb-article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const file = card.dataset.file;
                const title = card.dataset.title;
                const id = card.dataset.id;
                history.pushState({}, '', `?id=${id}`);
                document.querySelector('.kb-header').style.display = 'none';
                renderArticle(file, title);
            });
        });
    }

    function checkURLForArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        if (articleId) {
            document.querySelector('.kb-header').style.display = 'none';
            renderArticle(articleId);
        } else {
            document.querySelector('.kb-header').style.display = 'block';
            renderCategories();
        }
    }

    checkURLForArticle();
});
