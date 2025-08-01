document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("universalSearch");
  const searchContainer = document.querySelector(".search-container");

  if (searchInput && searchContainer) {
    let allArticles = [];
    const resultsContainer = document.createElement("div");
    resultsContainer.id = "universal-search-results";
    searchContainer.appendChild(resultsContainer);

    async function loadDatabase() {
      try {
        const response = await fetch("/api/getContent");
        if (!response.ok)
          throw new Error("Erro ao buscar dados do banco Firebase.");
        const data = await response.json();

        const activityArticles = data
          .filter((doc) => doc.type === "activity")
          .map((art) => ({
            ...art,
            category: `Artigos e Atividades / ${art.category}`,
            url: "atividades.html",
          }));

        allArticles = [ ...activityArticles];
      } catch (error) {
        console.error("Erro ao carregar o banco de dados da busca:", error);
        resultsContainer.innerHTML = `<div class="search-result-item-none">Erro ao carregar dados da busca.</div>`;
      }
    }

    function performSearch() {
      const searchTerm = searchInput.value.toLowerCase().trim();
      resultsContainer.innerHTML = "";

      if (searchTerm.length < 3) {
        resultsContainer.style.display = "none";
        return;
      }

      const filteredResults = allArticles.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm)
      );

      renderSearchResults(filteredResults);
    }

    function renderSearchResults(results) {
      if (results.length === 0) {
        resultsContainer.innerHTML = `<div class="search-result-item-none">Nenhum resultado encontrado.</div>`;
      } else {
        results.forEach((item) => {
          const resultItem = document.createElement("a");
          resultItem.href = `${item.url}?id=${item.id}`;
          resultItem.className = "search-result-item";
          resultItem.innerHTML = `
                        <div class="font-bold">${item.title}</div>
                        <div class="text-sm text-gray-500">${item.description}</div>
                        <div class="text-xs text-red-700 font-semibold mt-1 uppercase">${item.category}</div>
                    `;
          resultsContainer.appendChild(resultItem);
        });
      }
      resultsContainer.style.display = "block";
    }

    loadDatabase();
    searchInput.addEventListener("input", performSearch);

    document.addEventListener("click", function (event) {
      if (!searchContainer.contains(event.target)) {
        resultsContainer.style.display = "none";
      }
    });
  }

  // Mostrar botão de admin se role for 'admin'
  const role = localStorage.getItem("role");
  if (role === "admin", "supervisor") {
    document.getElementById("adminOnlyButton").style.display = "inline-block";
  }

  // Redirecionar botão admin
  document.getElementById("adminOnlyButton").addEventListener("click", () => {
    window.location.href = "admin.html"; // ou o destino desejado
  });
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  window.location.href = "login.html";
}
