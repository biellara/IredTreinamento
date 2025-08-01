// ativ-con.js

let allContent = [];
let currentModalType = "";
let dataLoaded = false;
const converter = new showdown.Converter({ tables: true, strikethrough: true });
const CACHE_KEY = "centralData";
const CACHE_EXPIRATION_MINUTES = 10;

function ensureGlobalSpinner() {
  if (!document.getElementById("global-loading")) {
    const spinner = document.createElement("div");
    spinner.id = "global-loading";
    spinner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #b91c1c;
      z-index: 9998;
    `;
    spinner.innerHTML =
      '<i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 0.5rem;"></i> Carregando...';
    document.body.appendChild(spinner);
  }
}

function getCachedData() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    const age = (Date.now() - parsed.timestamp) / (1000 * 60);
    if (age > CACHE_EXPIRATION_MINUTES) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function setCachedData(data) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

window.addEventListener("DOMContentLoaded", async () => {
  ensureGlobalSpinner();
  const loading = document.getElementById("global-loading");
  if (loading) loading.style.display = "flex";

  try {
    const cached = getCachedData();
    if (cached) {
      allContent = cached;
      dataLoaded = true;
    } else {
      const [contentResponse, quizResponse] = await Promise.all([
        fetch("/api/getContent"),
        fetch("/api/getQuiz", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!contentResponse.ok)
        throw new Error("Erro ao carregar conteúdos principais.");
      if (!quizResponse.ok) throw new Error("Erro ao carregar quizzes.");

      const contentData = await contentResponse.json();
      const quizData = await quizResponse.json();

      const quizzesFormatted = quizData.map((q) => ({
        ...q,
        type: "quiz",
        description: q.description || "Quiz de treinamento",
        category: q.category || "Quizzes",
      }));

      allContent = [...contentData, ...quizzesFormatted];
      setCachedData(allContent);
      dataLoaded = true;
    }
  } catch (err) {
    console.error("[INIT] Erro ao carregar conteúdos:", err);
  } finally {
    if (loading) loading.style.display = "none";
    checkURLAndRender();
  }
});

function openModal(type, itemData = null) {
  if (!dataLoaded) {
    showLoadingInsideModal();
    return;
  }
  currentModalType = type;
  const modal = document.getElementById("modalTipo");
  const searchInput = document.getElementById("modalSearch");
  if (!modal || !searchInput) return;

  modal.classList.add("active");
  searchInput.value = itemData ? itemData.title : "";

  renderModalList();
  searchInput.addEventListener("input", renderModalList);

  const titleMap = {
    activity: "Artigos Aprofundados",
    knowledgeBase: "Base de Conhecimento",
    quiz: "Quizzes",
  };
  document.getElementById("modalTitle").textContent =
    titleMap[type] || "Conteúdo";
}

function showLoadingInsideModal() {
  const modal = document.getElementById("modalTipo");
  const list = document.getElementById("modalList");
  const searchInput = document.getElementById("modalSearch");
  const title = document.getElementById("modalTitle");
  if (modal && list && searchInput && title) {
    modal.classList.add("active");
    list.innerHTML =
      '<div style="text-align:center; padding:2rem;"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</div>';
    searchInput.disabled = true;
    title.textContent = "Carregando...";
  }
}

function closeModal() {
  const modal = document.getElementById("modalTipo");
  const list = document.getElementById("modalList");
  if (modal && list) {
    modal.classList.remove("active");
    list.innerHTML = "";
  }
}

function renderModalList() {
  const list = document.getElementById("modalList");
  const search = document
    .getElementById("modalSearch")
    .value.toLowerCase()
    .trim();
  list.innerHTML = "";

  const filtered = allContent.filter(
    (item) =>
      item.type === currentModalType &&
      (item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search))
  );

  const now = Date.now();
  filtered.forEach((item) => {
    const updatedAt = item.updatedAt?.toDate?.() || new Date(item.updatedAt);
    const diffDays = Math.floor(
      (now - new Date(updatedAt)) / (1000 * 60 * 60 * 24)
    );
    const tag = diffDays <= 5 ? '<span class="new">🆕</span>' : "";
    const entry = document.createElement("div");
    entry.className = "item-entry";
    entry.innerHTML = `<strong>${item.title}</strong> ${tag}<br><small>${item.description}</small>`;
    entry.addEventListener("click", () => {
      const page = currentModalType === "quiz" ? "quiz.html" : "artigo.html";
      window.location.href = `${page}?id=${item.id}`;
    });
    list.appendChild(entry);
  });

  document.getElementById("modalSearch").disabled = false;
}

function aplicarFiltroGlobal() {
  const input = document.getElementById("globalSearchInput");
  const resultsContainer = document.getElementById("searchResultsContainer");

  if (!input || !resultsContainer) return;

  let searchTimeout;
  const typeMap = {
    activity: "Artigo",
    knowledgeBase: "Base de Conhecimento",
    quiz: "Quiz",
  };

  input.addEventListener("input", function (e) {
    const term = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimeout);
    resultsContainer.innerHTML = "";

    if (term.length < 2) {
      resultsContainer.style.display = "none";
      return;
    }

    searchTimeout = setTimeout(() => {
      const matches = allContent.filter((item) => {
        const title = item.title?.toLowerCase() || "";
        const desc = item.description?.toLowerCase() || "";
        return title.includes(term) || desc.includes(term);
      });

      if (matches.length === 0) {
        resultsContainer.style.display = "none";
        return;
      }

      resultsContainer.style.display = "block";

      matches.forEach((match) => {
        const resultItem = document.createElement("div");
        resultItem.className = "search-result-item";
        let shortDesc = match.description || "";
        if (shortDesc.length > 100) {
          shortDesc = shortDesc.substring(0, 100) + "...";
        }
        const typeName = typeMap[match.type] || "Conteúdo";
        const typeClass = match.type;
        resultItem.innerHTML = `
          <div class="result-info">
            <strong class="result-title">${match.title}</strong>
            <p class="result-description">${shortDesc}</p>
          </div>
          <span class="result-type ${typeClass}">${typeName}</span>
        `;
        resultItem.addEventListener("click", () => {
          const modalType =
            match.type === "quiz"
              ? "quiz"
              : match.type === "knowledgeBase"
              ? "knowledgeBase"
              : "activity";
          openModal(modalType, match);
          input.value = "";
          resultsContainer.innerHTML = "";
          resultsContainer.style.display = "none";
        });
        resultsContainer.appendChild(resultItem);
      });
    }, 250);
  });

  document.addEventListener("click", function (event) {
    if (!input.contains(event.target)) {
      resultsContainer.style.display = "none";
    }
  });
}

function checkURLAndRender() {
  aplicarFiltroGlobal();
}

// Fechar modais ao clicar fora do conteúdo
window.addEventListener('click', (e) => {
  document.querySelectorAll('.modal, .modal-overlay').forEach(modal => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});

// Fechar modais ao clicar em botões de fechar com classe modal-close-btn
document.querySelectorAll('.modal-close-btn, .modal .modal-header button').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal, .modal-overlay');
    if (modal) modal.classList.remove('active');
  });
});