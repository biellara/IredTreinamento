document.addEventListener('DOMContentLoaded', async function () {
  const isAtividades = document.getElementById('activities-main-content') !== null;
  const isConhecimento = document.getElementById('kb-main-content') !== null;
  if (!isAtividades && !isConhecimento) return;

  const mainContent = document.getElementById(isAtividades ? 'activities-main-content' : 'kb-main-content');
  const articleTemplate = document.getElementById('article-template');
  const categoriesTemplate = document.getElementById('categories-template');
  const searchInput = document.getElementById(isAtividades ? 'activities-search-input' : 'kb-search-input');
  const pageHeader = document.querySelector('.kb-header');
  const globalBackButton = document.querySelector('body > a.back-button');

  const techAssistantModal = document.getElementById('techAssistantModal');
  const closeTechAssistantModalBtn = document.getElementById('closeTechAssistantModalBtn');
  const explainForMeBtn = document.getElementById('explainForMeBtn');
  const explainForCustomerBtn = document.getElementById('explainForCustomerBtn');
  const techTopicContent = document.getElementById('tech-topic-content');
  const techAssistantLoader = document.getElementById('tech-assistant-loader');
  const techAssistantResults = document.getElementById('tech-assistant-results');
  const techAssistantOutput = document.getElementById('tech-assistant-output');
  const resultsTitle = techAssistantResults?.querySelector('.results-title');

  let knowledgeData = [];
  let allArticles = [];

  const converter = new showdown.Converter({
    extensions: [() => [{
      type: 'output',
      regex: /<blockquote>\s*<p>\[!(NOTE|WARNING|DANGER)\]/g,
      replace: (match, type) => {
        const lType = type.toLowerCase();
        const icon = lType === 'warning' ? 'fa-triangle-exclamation' : lType === 'danger' ? 'fa-hand' : 'fa-circle-info';
        return `<div class="callout ${lType}"><i class="callout-icon fa-solid ${icon}"></i><div class="callout-content">`;
      }
    }, {
      type: 'output', regex: /<\/p>\s*<\/blockquote>/g, replace: '</div></div>'
    }]],
    strikethrough: true, tables: true
  });

  async function loadData() {
    try {
      const response = await fetch('/api/getContent');
      if (!response.ok) throw new Error('Erro ao buscar dados do banco.');
      const data = await response.json();

      const isActivity = doc => doc.type === (isAtividades ? 'activity' : 'knowledgeBase');
      const filtered = data.filter(isActivity);
      if (filtered.length === 0) throw new Error(isAtividades ? 'Nenhuma atividade encontrada.' : 'Nenhum artigo encontrado.');

      allArticles = filtered;

      knowledgeData = filtered.reduce((acc, article) => {
        let category = acc.find(c => c.category === article.category);
        if (!category) {
          category = { category: article.category, articles: [] };
          acc.push(category);
        }
        category.articles.push(article);
        return acc;
      }, []);

      checkURLAndRender();

    } catch (err) {
      console.error(err);
      mainContent.innerHTML = `<p><strong>Erro:</strong> ${err.message}</p>`;
    }
  }

  function renderCategories(categories = knowledgeData) {
    const templateNode = categoriesTemplate.content.cloneNode(true);
    const categoriesContainer = templateNode.querySelector('#categories-container');
    categoriesContainer.innerHTML = '';
    mainContent.innerHTML = '';

    categories.forEach(category => {
      if (category.articles.length > 0) {
        categoriesContainer.appendChild(buildCategorySection(category));
      }
    });

    mainContent.appendChild(templateNode);
    addCardListeners();
  }

  function buildCategorySection(category) {
    const articlesHTML = category.articles.map(article => `
      <a href="#" class="kb-article-card" data-id="${article.id}">
        <h3 class="kb-article-title">${article.title}</h3>
        <p class="kb-article-desc">${article.description}</p>
      </a>`).join('');

    const section = document.createElement('section');
    const iconHTML = category.icon ? `<i class="fa-solid ${category.icon}"></i>` : '';
    section.innerHTML = `<h2 class="kb-category-title">${iconHTML}${category.category}</h2><div class="kb-category-grid">${articlesHTML}</div>`;
    return section;
  }

  async function renderArticle(articleId) {
    const articleData = allArticles.find(a => a.id === articleId);
    if (!articleData) {
      mainContent.innerHTML = '<p>Artigo não encontrado.</p>';
      return;
    }

    try {
      const response = await fetch(`./articles/${articleData.file}`);
      if (!response.ok) throw new Error(`Arquivo '${articleData.file}' não encontrado.`);
      const markdownContent = await response.text();
      const htmlContent = converter.makeHtml(markdownContent);

      const templateNode = articleTemplate.content.cloneNode(true);
      templateNode.querySelector('.article-title').textContent = articleData.title;
      templateNode.querySelector('.article-content').innerHTML = htmlContent;

      mainContent.innerHTML = '';
      mainContent.appendChild(templateNode);

      mainContent.querySelector('.back-button')?.addEventListener('click', () => window.history.back());

      mainContent.querySelector('.tech-assistant-button')?.addEventListener('click', () => {
        const topic = `${articleData.title}\n\n${articleData.description}`;
        if (techTopicContent) techTopicContent.textContent = topic;
        if (techAssistantResults) techAssistantResults.style.display = 'none';
        if (techAssistantLoader) techAssistantLoader.style.display = 'none';
        if (techAssistantModal) techAssistantModal.classList.add('visible');
      });
    } catch (error) {
      mainContent.innerHTML = `<p><strong>Erro:</strong> ${error.message}</p>`;
    }
  }

  searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (searchTerm.length < 2) {
      renderCategories();
      return;
    }

    const filteredArticles = allArticles.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.description.toLowerCase().includes(searchTerm)
    );

    const filteredCategories = knowledgeData.map(category => ({
      ...category,
      articles: category.articles.filter(article => filteredArticles.some(fa => fa.id === article.id))
    })).filter(category => category.articles.length > 0);

    renderCategories(filteredCategories);
  });

  function addCardListeners() {
    document.querySelectorAll('.kb-article-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const articleId = card.dataset.id;
        const articleData = allArticles.find(a => a.id === articleId);

        if (isAtividades && articleData?.categoryName?.toLowerCase().includes('quiz')) {
          window.location.href = `quiz.html?id=${articleId}`;
        } else {
          window.history.pushState({ id: articleId }, '', `?id=${articleId}`);
          checkURLAndRender();
        }
      });
    });
  }

  function checkURLAndRender() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (articleId) {
      const articleData = allArticles.find(a => a.id === articleId);
      if (isAtividades && articleData?.categoryName?.toLowerCase().includes('quiz')) {
        window.location.href = `quiz.html?id=${articleId}`;
        return;
      }

      if (pageHeader) pageHeader.style.display = 'none';
      if (globalBackButton) globalBackButton.style.display = 'none';
      renderArticle(articleId);
    } else {
      if (pageHeader) pageHeader.style.display = 'block';
      if (globalBackButton) globalBackButton.style.display = 'inline-flex';
      renderCategories();
    }
  }

  window.addEventListener('popstate', () => checkURLAndRender());

  closeTechAssistantModalBtn?.addEventListener('click', () => techAssistantModal?.classList.remove('visible'));
  explainForMeBtn?.addEventListener('click', () => handleTechAssistant("Explique para mim, de forma resumida e técnica"));
  explainForCustomerBtn?.addEventListener('click', () => handleTechAssistant("Gere uma fala simples e empática e também resumida para explicar isso a um cliente leigo"));
  techAssistantModal?.addEventListener('click', (e) => {
    if (e.target === techAssistantModal) techAssistantModal.classList.remove('visible');
  });

  async function handleTechAssistant(promptPrefix) {
    const topic = techTopicContent?.textContent?.trim();
    if (!topic) return;
    const fullPrompt = `${promptPrefix}:\n${topic}`;

    techAssistantLoader.style.display = 'block';
    techAssistantResults.style.display = 'none';

    try {
      const responseText = await callGeminiAPI(fullPrompt);
      techAssistantOutput.innerHTML = converter.makeHtml(responseText);
      if (resultsTitle) resultsTitle.textContent = promptPrefix.split(',')[0];
      techAssistantResults.style.display = 'block';
    } catch (err) {
      techAssistantOutput.innerHTML = `<p style="color: var(--brand-red);"><strong>Erro:</strong> ${err.message}</p>`;
      if (resultsTitle) resultsTitle.textContent = "Erro";
      techAssistantResults.style.display = 'block';
    } finally {
      techAssistantLoader.style.display = 'none';
    }
  }

  async function callGeminiAPI(prompt) {
    const apiEndpoint = '/api/gemini';
    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Erro ${response.status}: ${errorBody}`);
      }
      const result = await response.json();
      return result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
    } catch (error) {
      console.error("Erro ao chamar Gemini API:", error);
      throw error;
    }
  }

  loadData();
});
