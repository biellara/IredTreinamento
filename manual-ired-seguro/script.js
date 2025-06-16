document.addEventListener('DOMContentLoaded', function() {
    
    // --- Simulação dos Bancos de Dados ---
    // Em um projeto real, isso viria de um único ponto ou de chamadas de API.
    // Por enquanto, duplicamos os dados aqui para a busca funcionar.
    const knowledgeBaseData = [
        {
            category: 'Diagnóstico de Conexão',
            url: 'conhecimento.html',
            articles: [
                { id: 'analise-sinal', title: 'Análise de Sinais Ópticos (ONU/OLT)', description: 'Como interpretar os níveis de sinal dBm para diagnosticar problemas.' },
                { id: 'leds-onu', title: 'Interpretação de LEDs da ONU', description: 'O que significam as luzes POWER, PON, LOS e LAN.' },
                { id: 'procedimento-los', title: 'Procedimento para Luz LOS Vermelha', description: 'Passo a passo para quando o cliente está sem sinal óptico.' },
                { id: 'falha-massiva', title: 'Verificação de Falhas Massivas', description: 'Como identificar se o problema afeta uma região inteira.'}
            ]
        },
        {
            category: 'Rede Local e Wi-Fi',
            url: 'conhecimento.html',
            articles: [
                { id: 'cabos-rede', title: 'Diferença entre Cabos de Rede', description: 'Impacto dos cabos CAT5 e CAT5e na velocidade contratada.' },
                { id: 'canais-wifi', title: 'Otimização de Canais Wi-Fi', description: 'Melhores práticas para as redes 2.4GHz e 5GHz.'}
            ]
        }
    ];
    const activitiesData = [
        {
            category: 'Artigos Aprofundados',
            url: 'atividades.html',
            articles: [
                { id: 'arquitetura-pon', title: 'A Arquitetura de uma Rede PON', description: 'Entenda o caminho do sinal da OLT até a ONU do cliente.' },
                { id: 'espectro-wifi', title: 'Entendendo o Espectro Wi-Fi', description: 'O "porquê" da troca de canais e as bandas de frequência.'}
            ]
        },
        {
            category: 'Módulos de Treinamento',
            url: 'atividades.html',
            articles: [
                { id: 'onboarding-n1', title: 'Onboarding N1: Semana 1', description: 'Conceitos essenciais para novos colaboradores do suporte.' }
            ]
        }
    ];

    // --- Elementos do DOM ---
    const searchInput = document.getElementById('universalSearch');
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'universal-search-results';
    // Garante que o container de resultados seja adicionado ao local correto.
    const searchContainer = document.querySelector('.search-container');
    if(searchContainer) {
        searchContainer.appendChild(resultsContainer);
    }


    // --- Funções da Busca ---
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        resultsContainer.innerHTML = ''; // Limpa resultados anteriores

        if (searchTerm.length < 3) {
            resultsContainer.style.display = 'none';
            return;
        }

        const allData = [
            ...knowledgeBaseData.flatMap(cat => cat.articles.map(art => ({ ...art, category: `Base de Conhecimento / ${cat.category}`, url: cat.url }))),
            ...activitiesData.flatMap(cat => cat.articles.map(art => ({ ...art, category: `Artigos e Atividades / ${cat.category}`, url: cat.url })))
        ];

        const filteredResults = allData.filter(item => 
            item.title.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm)
        );

        renderSearchResults(filteredResults);
    }

    function renderSearchResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="search-result-item-none">Nenhum resultado encontrado.</div>`;
            resultsContainer.style.display = 'block';
            return;
        }
        
        results.forEach(item => {
            const resultItem = document.createElement('a');
            resultItem.href = `${item.url}?id=${item.id}`;
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="font-bold">${item.title}</div>
                <div class="text-sm text-gray-500">${item.description}</div>
                <div class="text-xs text-red-700 font-semibold mt-1 uppercase">${item.category}</div>
            `;
            resultsContainer.appendChild(resultItem);
        });

        resultsContainer.style.display = 'block';
    }

    // --- Event Listeners ---
    searchInput.addEventListener('input', performSearch);
    
    // Esconde os resultados se clicar fora
    document.addEventListener('click', function(event) {
        if (!searchContainer.contains(event.target)) {
            resultsContainer.style.display = 'none';
        }
    });

});
