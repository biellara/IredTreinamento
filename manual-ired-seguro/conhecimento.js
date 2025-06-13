document.addEventListener('DOMContentLoaded', function () {

    // --- Banco de Dados dos Artigos (agora apenas metadados) ---
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
                { id: 'otimizacao-wifi', title: 'Otimização de Canais Wi-Fi', description: 'Melhores práticas para as redes 2.4GHz e 5GHz.', file: 'otimizacao-wifi.md' },
            ]
        },
        // Adicione mais categorias e artigos aqui no futuro
    ];

    // --- Elementos do DOM ---
    const mainContent = document.getElementById('kb-main-content');
    const searchInput = document.getElementById('kb-search-input');
    const articleTemplate = document.getElementById('article-template');
    const converter = new showdown.Converter(); // Instancia o conversor de Markdown

    // --- Funções de Renderização ---

    function renderCategories() {
        mainContent.innerHTML = '';
        knowledgeBase.forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.className = 'mb-12';
            
            let articlesHTML = '';
            category.articles.forEach(article => {
                articlesHTML += `
                    <a href="#" class="kb-article-card" data-id="${article.id}" data-file="${article.file}">
                        <h3 class="kb-article-title">${article.title}</h3>
                        <p class="kb-article-desc">${article.description}</p>
                    </a>
                `;
            });

            categorySection.innerHTML = `
                <h2 class="kb-category-title">${category.category}</h2>
                <div class="kb-category-grid">${articlesHTML}</div>
            `;
            mainContent.appendChild(categorySection);
        });
        addCardListeners();
    }

    async function renderArticle(articleId, articleFile, articleTitle) {
        try {
            const response = await fetch(`./articles/${articleFile}`);
            if (!response.ok) {
                throw new Error(`Não foi possível carregar o arquivo do artigo: ${response.statusText}`);
            }
            const markdownContent = await response.text();
            const htmlContent = converter.makeHtml(markdownContent); // Converte Markdown para HTML

            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = articleTitle;
            templateNode.querySelector('.article-content').innerHTML = htmlContent;

            mainContent.innerHTML = '';
            mainContent.appendChild(templateNode);
            mainContent.querySelector('.article-back-button').addEventListener('click', renderCategories);

        } catch (error) {
            console.error('Erro ao renderizar o artigo:', error);
            mainContent.innerHTML = `<p class="text-red-500">Erro: ${error.message}. Verifique se o arquivo existe e o caminho está correto.</p>`;
        }
    }
    
    function addCardListeners() {
        document.querySelectorAll('.kb-article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const articleId = card.dataset.id;
                const articleFile = card.dataset.file;
                const articleTitle = card.querySelector('.kb-article-title').textContent;
                renderArticle(articleId, articleFile, articleTitle);
            });
        });
    }

    // --- Inicialização ---
    renderCategories();
});
