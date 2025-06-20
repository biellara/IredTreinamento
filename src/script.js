document.addEventListener('DOMContentLoaded', function() {

    const searchInput = document.getElementById('universalSearch');
    const searchContainer = document.querySelector('.search-container');

    if (searchInput && searchContainer) {
        let allArticles = [];
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'universal-search-results';
        searchContainer.appendChild(resultsContainer);

        async function loadDatabase() {
            try {
                // Buscar do Firebase via Serverless, não mais do arquivo local
                const response = await fetch('/.netlify/functions/getContent');
                if (!response.ok) throw new Error('Erro ao buscar dados do banco Firebase.');
                const data = await response.json();

                // Filtrar e mapear os dados para a busca
                const kbArticles = data
                    .filter(doc => doc.type === 'knowledgeBase')
                    .map(art => ({
                        ...art,
                        category: `Base de Conhecimento / ${art.category}`,
                        url: 'conhecimento.html'
                    }));

                const activityArticles = data
                    .filter(doc => doc.type === 'activity')
                    .map(art => ({
                        ...art,
                        category: `Artigos e Atividades / ${art.category}`,
                        url: 'atividades.html'
                    }));

                allArticles = [...kbArticles, ...activityArticles];
            } catch (error) {
                console.error("Erro ao carregar o banco de dados da busca:", error);
                resultsContainer.innerHTML = `<div class="search-result-item-none">Erro ao carregar dados da busca.</div>`;
            }
        }

        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            resultsContainer.innerHTML = '';

            if (searchTerm.length < 3) {
                resultsContainer.style.display = 'none';
                return;
            }

            const filteredResults = allArticles.filter(item =>
                item.title.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm)
            );

            renderSearchResults(filteredResults);
        }

        function renderSearchResults(results) {
            if (results.length === 0) {
                resultsContainer.innerHTML = `<div class="search-result-item-none">Nenhum resultado encontrado.</div>`;
            } else {
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
            }
            resultsContainer.style.display = 'block';
        }

        loadDatabase();
        searchInput.addEventListener('input', performSearch);

        document.addEventListener('click', function(event) {
            if (!searchContainer.contains(event.target)) {
                resultsContainer.style.display = 'none';
            }
        });
    }
});
