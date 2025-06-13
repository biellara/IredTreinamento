document.addEventListener('DOMContentLoaded', function () {

    // --- Banco de Dados dos Artigos (Esqueleto do Conteúdo) ---
    const knowledgeBase = [
        {
            category: 'Diagnóstico de Conexão',
            articles: [
                { id: 'analise-sinal', title: 'Análise de Sinais Ópticos (ONU/OLT)', description: 'Como interpretar os níveis de sinal dBm para diagnosticar problemas.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'leds-onu', title: 'Interpretação de LEDs da ONU', description: 'O que significam as luzes POWER, PON, LOS e LAN.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'procedimento-los', title: 'Procedimento para Luz LOS Vermelha', description: 'Passo a passo para quando o cliente está sem sinal óptico.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'falha-massiva', title: 'Verificação de Falhas Massivas', description: 'Como identificar se o problema afeta uma região inteira.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
            ]
        },
        {
            category: 'Rede Local e Wi-Fi',
            articles: [
                { id: 'cabos-rede', title: 'Diferença entre Cabos de Rede', description: 'Impacto dos cabos CAT5 e CAT5e na velocidade contratada.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'otimizacao-wifi', title: 'Otimização de Canais Wi-Fi', description: 'Melhores práticas para as redes 2.4GHz e 5GHz.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'interferencia-wifi', title: 'Diagnóstico de Interferência', description: 'Identificando e resolvendo problemas de interferência de sinal.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'config-roteador', title: 'Configuração de Roteadores', description: 'Guia para modo Bridge, PPPoE e outras configurações.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
            ]
        },
        {
            category: 'Equipamentos e Sistemas',
            articles: [
                { id: 'modelos-onu', title: 'Modelos de ONU e Especificações', description: 'Guia de referência para os equipamentos na casa do cliente.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'reset-equipamentos', title: 'Reset Físico vs. Reset Lógico', description: 'Quando e como orientar o cliente a reiniciar os aparelhos.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
                { id: 'consulta-sistema', title: 'Consulta de Clientes no Sistema', description: 'Como ler os dados de consumo e logs de conexão.', content: 'Placeholder para o conteúdo detalhado do artigo.' },
            ]
        }
    ];

    // --- Elementos do DOM ---
    const mainContent = document.getElementById('kb-main-content');
    const searchInput = document.getElementById('kb-search-input');
    const articleTemplate = document.getElementById('article-template');

    // --- Funções de Renderização ---

    // Renderiza a tela principal com as categorias e artigos
    function renderCategories() {
        mainContent.innerHTML = ''; // Limpa o conteúdo atual
        knowledgeBase.forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.className = 'mb-12';
            
            let articlesHTML = '';
            category.articles.forEach(article => {
                articlesHTML += `
                    <a href="#" class="kb-article-card" data-id="${article.id}">
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

        // Adiciona os event listeners aos cards recém-criados
        addCardListeners();
    }

    // Renderiza a visualização de um artigo específico
    function renderArticle(articleId) {
        let article = null;
        for (const category of knowledgeBase) {
            article = category.articles.find(a => a.id === articleId);
            if (article) break;
        }

        if (article) {
            const templateNode = articleTemplate.content.cloneNode(true);
            templateNode.querySelector('.article-title').textContent = article.title;
            templateNode.querySelector('.article-content').innerHTML = article.content; // Usamos innerHTML caso o conteúdo tenha HTML

            mainContent.innerHTML = ''; // Limpa o conteúdo
            mainContent.appendChild(templateNode);

            // Adiciona o event listener ao botão "Voltar"
            mainContent.querySelector('.article-back-button').addEventListener('click', renderCategories);
        } else {
            mainContent.innerHTML = '<p>Artigo não encontrado.</p>';
        }
    }
    
    // Adiciona os listeners de clique aos cards dos artigos
    function addCardListeners() {
        document.querySelectorAll('.kb-article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const articleId = card.dataset.id;
                renderArticle(articleId);
            });
        });
    }

    // --- Inicialização ---
    renderCategories(); // Renderiza a tela inicial
});
