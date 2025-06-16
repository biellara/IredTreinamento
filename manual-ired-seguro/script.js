document.addEventListener('DOMContentLoaded', function() {
    
    const searchInput = document.getElementById('universalSearch');
    const searchContainer = document.querySelector('.search-container');
    
    // VERIFICAÇÃO: Apenas executa o código de busca se os elementos existirem
    if (searchInput && searchContainer) {
        let allArticles = [];
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'universal-search-results';
        searchContainer.appendChild(resultsContainer);

        async function loadDatabase() {
            try {
                const response = await fetch('./database.json');
                if (!response.ok) throw new Error('database.json não encontrado.');
                const db = await response.json();
                
                const kbArticles = db.knowledgeBase.flatMap(cat => 
                    cat.articles.map(art => ({ ...art, category: `Base de Conhecimento / ${cat.category}`, url: 'conhecimento.html' }))
                );
                const activityArticles = db.activities.flatMap(cat => 
                    cat.articles.map(art => ({ ...art, category: `Artigos e Atividades / ${cat.category}`, url: 'atividades.html' }))
                );
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
