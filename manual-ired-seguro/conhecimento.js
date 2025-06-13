document.addEventListener('DOMContentLoaded', function () {

    // --- Banco de Dados dos Artigos (Conteúdo Detalhado) ---
    const knowledgeBase = [
        {
            category: 'Diagnóstico de Conexão',
            articles: [
                { 
                    id: 'analise-sinal', 
                    title: 'Análise de Sinais Ópticos (ONU/OLT)', 
                    description: 'Como interpretar os níveis de sinal dBm para diagnosticar problemas.', 
                    content: `
                        <p>O nível de sinal óptico, medido em <strong>dBm (decibéis-miliwatt)</strong>, é o indicador mais crucial da qualidade da conexão física da fibra. É um valor negativo, e <strong>quanto mais próximo de 0, melhor o sinal.</strong></p>
                        <ul>
                            <li><strong>Sinal Ideal:</strong> Entre -15 dBm e -25 dBm. Nesta faixa, a conexão é estável e robusta.</li>
                            <li><strong>Sinal Aceitável (Atenção):</strong> Entre -25 dBm e -27 dBm. A conexão ainda funciona, mas está perto do limite e pode sofrer com pequenas oscilações ou degradações na fibra.</li>
                            <li><strong>Sinal Ruim (Crítico):</strong> Abaixo de -27 dBm. O sinal é muito fraco, resultando em quedas de conexão, perda de pacotes e lentidão. Um valor de -28 dBm é pior que -27 dBm.</li>
                        </ul>
                        <p><strong>Ação Imediata:</strong> Se o sinal do cliente estiver consistentemente abaixo de -27 dBm, é indicativo de um problema físico na rede externa (fibra atenuada, conector sujo na caixa, etc.). O procedimento padrão é <strong>abrir uma Ordem de Serviço (O.S.)</strong> para que a equipe técnica de campo possa investigar.</p>
                    ` 
                },
                { 
                    id: 'leds-onu', 
                    title: 'Interpretação de LEDs da ONU', 
                    description: 'O que significam as luzes POWER, PON, LOS e LAN.', 
                    content: `
                        <p>As luzes (LEDs) na ONU fornecem um diagnóstico rápido do estado da conexão. O padrão pode variar levemente entre modelos, mas geralmente segue esta lógica:</p>
                        <ul>
                            <li><strong>POWER:</strong><br>
                                <strong>Verde Fixo:</strong> Normal. O aparelho está ligado e recebendo energia.
                            </li>
                            <li><strong>PON (Passive Optical Network):</strong><br>
                                <strong>Verde Fixo:</strong> Normal. A ONU está autenticada na rede da IRED e recebendo sinal da OLT.<br>
                                <strong>Verde Piscando:</strong> Tentando autenticar. Pode indicar um problema de provisionamento. Se persistir, escalar para o N2.
                            </li>
                            <li><strong>LOS (Loss of Signal):</strong><br>
                                <strong>Apagado:</strong> Normal. Não há perda de sinal.<br>
                                <strong class="text-red-600">Vermelho Fixo ou Piscando:</strong> Alerta Crítico! Indica perda total do sinal óptico. Este é o principal indicador de que há um problema físico na fibra.
                            </li>
                            <li><strong>LAN (Local Area Network):</strong><br>
                                <strong>Verde Fixo ou Piscando:</strong> Normal. Indica que há um dispositivo conectado via cabo de rede (roteador ou computador) e há tráfego de dados.
                            </li>
                        </ul>
                    ` 
                },
                { 
                    id: 'procedimento-los', 
                    title: 'Procedimento para Luz LOS Vermelha', 
                    description: 'Passo a passo para quando o cliente está sem sinal óptico.', 
                    content: `
                        <p>A luz <strong>LOS vermelha</strong> é um problema de alta prioridade, pois significa que o cliente está totalmente sem conexão por uma falha física. Siga estes passos:</p>
                        <ol class="list-decimal pl-5">
                            <li><strong>Confirme com o Cliente:</strong> Peça ao cliente para verificar se a luz LOS na ONU está realmente acesa e vermelha.</li>
                            <li><strong>Verifique Falhas Massivas:</strong> Antes de tudo, consulte os canais internos (grupos, dashboards) para ver se há uma falha massiva reportada para a região ou para a OLT/PON do cliente. Se houver, informe o cliente sobre a instabilidade e o prazo de normalização.</li>
                            <li><strong>Verificação Física Simples:</strong> Instrua o cliente a verificar se o cabo fino da fibra (geralmente verde ou azul) está bem conectado na parte de trás da ONU, sem estar dobrado ou quebrado. <strong>NÃO peça para o cliente desconectar e reconectar.</strong></li>
                            <li><strong>Agendamento de O.S.:</strong> Se não for uma falha massiva e a verificação física simples não resolver, o problema é externo. Informe ao cliente que será necessária uma visita técnica para resolver o problema na rede e proceda com a abertura da Ordem de Serviço.</li>
                        </ol>
                    ` 
                },
                { 
                    id: 'falha-massiva', 
                    title: 'Verificação de Falhas Massivas', 
                    description: 'Como identificar se o problema afeta uma região inteira.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
            ]
        },
        {
            category: 'Rede Local e Wi-Fi',
            articles: [
                { 
                    id: 'cabos-rede', 
                    title: 'Diferença entre Cabos de Rede', 
                    description: 'Impacto dos cabos CAT5 e CAT5e na velocidade contratada.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
                { 
                    id: 'otimizacao-wifi', 
                    title: 'Otimização de Canais Wi-Fi', 
                    description: 'Melhores práticas para as redes 2.4GHz e 5GHz.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
                { 
                    id: 'interferencia-wifi', 
                    title: 'Diagnóstico de Interferência', 
                    description: 'Identificando e resolvendo problemas de interferência de sinal.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
                { 
                    id: 'config-roteador', 
                    title: 'Configuração de Roteadores', 
                    description: 'Guia para modo Bridge, PPPoE e outras configurações.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
            ]
        },
        {
            category: 'Equipamentos e Sistemas',
            articles: [
                { 
                    id: 'modelos-onu', 
                    title: 'Modelos de ONU e Especificações', 
                    description: 'Guia de referência para os equipamentos na casa do cliente.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
                { 
                    id: 'reset-equipamentos', 
                    title: 'Reset Físico vs. Reset Lógico', 
                    description: 'Quando e como orientar o cliente a reiniciar os aparelhos.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
                { 
                    id: 'consulta-sistema', 
                    title: 'Consulta de Clientes no Sistema', 
                    description: 'Como ler os dados de consumo e logs de conexão.', 
                    content: 'Placeholder para o conteúdo detalhado do artigo.' 
                },
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
            templateNode.querySelector('.article-content').innerHTML = article.content; // Usamos innerHTML para renderizar o HTML do conteúdo

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
