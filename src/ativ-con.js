// ativ-con.js

let allContent = [];
let currentModalType = '';
let dataLoaded = false;
const converter = new showdown.Converter({ tables: true, strikethrough: true });
const CACHE_KEY = 'centralData';
const CACHE_EXPIRATION_MINUTES = 10;

// Cria spinner global se não existir
function ensureGlobalSpinner() {
  if (!document.getElementById('global-loading')) {
    const spinner = document.createElement('div');
    spinner.id = 'global-loading';
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
    spinner.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 0.5rem;"></i> Carregando...';
    document.body.appendChild(spinner);
  }
}

// Valida cache local
function getCachedData() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached);
    const age = (Date.now() - parsed.timestamp) / (1000 * 60); // minutos
    if (age > CACHE_EXPIRATION_MINUTES) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

function setCachedData(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}

// Carrega dados ao iniciar
window.addEventListener('DOMContentLoaded', async () => {
  ensureGlobalSpinner();
  const loading = document.getElementById('global-loading');
  if (loading) loading.style.display = 'flex';

  try {
    const cached = getCachedData();
    if (cached) {
      allContent = cached;
      dataLoaded = true;
    } else {
      const [contentResponse, quizResponse] = await Promise.all([
        fetch('/api/getContent'),
        fetch('/api/getQuiz', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!contentResponse.ok) throw new Error('Erro ao carregar conteúdos principais.');
      if (!quizResponse.ok) throw new Error('Erro ao carregar quizzes.');

      const contentData = await contentResponse.json();
      const quizData = await quizResponse.json();

      const quizzesFormatted = quizData.map(q => ({
        ...q,
        type: 'quiz',
        description: q.description || 'Quiz de treinamento',
        category: q.category || 'Quizzes'
      }));

      allContent = [...contentData, ...quizzesFormatted];
      setCachedData(allContent);
      dataLoaded = true;
    }
  } catch (err) {
    console.error('[INIT] Erro ao carregar conteúdos:', err);
  } finally {
    if (loading) loading.style.display = 'none';
  }
});

function openModal(type) {
  if (!dataLoaded) {
    showLoadingInsideModal();
    return;
  }

  currentModalType = type;

  const modal = document.getElementById('modalTipo');
  const searchInput = document.getElementById('modalSearch');

  if (!modal || !searchInput) return;

  modal.classList.add('active');
  searchInput.value = '';
  renderModalList();
  searchInput.addEventListener('input', renderModalList);

  const titleMap = {
    activity: 'Artigos Aprofundados',
    knowledgeBase: 'Base de Conhecimento',
    quiz: 'Quizzes'
  };
  document.getElementById('modalTitle').textContent = titleMap[type] || 'Conteúdo';
}

function showLoadingInsideModal() {
  const modal = document.getElementById('modalTipo');
  const list = document.getElementById('modalList');
  const searchInput = document.getElementById('modalSearch');
  const title = document.getElementById('modalTitle');

  if (modal && list && searchInput && title) {
    modal.classList.add('active');
    list.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</div>';
    searchInput.disabled = true;
    title.textContent = 'Carregando...';
  }
}

function closeModal() {
  const modal = document.getElementById('modalTipo');
  const list = document.getElementById('modalList');
  if (modal && list) {
    modal.classList.remove('active');
    list.innerHTML = '';
  }
}

function renderModalList() {
  const list = document.getElementById('modalList');
  const search = document.getElementById('modalSearch').value.toLowerCase().trim();
  list.innerHTML = '';

  const filtered = allContent.filter(item =>
    item.type === currentModalType &&
    (item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search))
  );

  const now = Date.now();
  filtered.forEach(item => {
    const updatedAt = item.updatedAt?.toDate?.() || new Date(item.updatedAt);
    const diffDays = Math.floor((now - new Date(updatedAt)) / (1000 * 60 * 60 * 24));
    const tag = diffDays <= 5 ? '<span class="new">🆕</span>' : '';

    const entry = document.createElement('div');
    entry.className = 'item-entry';
    entry.innerHTML = `<strong>${item.title}</strong> ${tag}<br><small>${item.description}</small>`;
    entry.addEventListener('click', () => {
      const page = currentModalType === 'quiz' ? 'quiz.html' : 'artigo.html';
      window.location.href = `${page}?id=${item.id}`;
    });
    list.appendChild(entry);
  });

  document.getElementById('modalSearch').disabled = false;
}

// Assistente Técnico Universal
function abrirAssistente() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      padding: 1.5rem;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      font-family: 'Inter', sans-serif;
      position: relative;
    ">
      <button onclick="this.closest('.modal-overlay').remove()" style="
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.25rem;
        background: none;
        border: none;
        color: #991b1b;
        cursor: pointer;
      ">&times;</button>

      <h2 style="color: #991b1b; font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem;">
        <i class="fa-solid fa-brain"></i> Assistente Técnico
      </h2>

      <textarea id="techQuestion" placeholder="Digite sua dúvida técnica..." style="
        width: 95%;
        height: 100px;
        padding: 0.75rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
        resize: true;
        margin-bottom: 1rem;
        font-family: inherit;
      "></textarea>

      <div style="display: flex; gap: 0.75rem;">
        <button onclick="enviarPergunta('Explique tecnicamente')" style="
          flex: 1;
          background: #991b1b;
          color: white;
          padding: 0.6rem;
          border: none;
          border-radius: 0.4rem;
          font-weight: 600;
          cursor: pointer;
        ">Explicação Técnica</button>

        <button onclick="enviarPergunta('Explique para o cliente')" style="
          flex: 1;
          background: #b91c1c;
          color: white;
          padding: 0.6rem;
          border: none;
          border-radius: 0.4rem;
          font-weight: 600;
          cursor: pointer;
        ">Explicação para o Cliente</button>
      </div>

      <div id="techAssistantResposta" class="prose" style="margin-top: 2rem; max-height: 300px; overflow-y: auto;"></div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function enviarPergunta(promptPrefix) {
  const pergunta = document.getElementById('techQuestion')?.value.trim();
  if (!pergunta) return;

  const respostaDiv = document.getElementById('techAssistantResposta');
  respostaDiv.innerHTML = '<p><em>Processando resposta com IA...</em></p>';

  try {
    const payload = {
      contents: [{ role: "user", parts: [{ text: `${promptPrefix}:
${pergunta}` }] }]
    };

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const resposta = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
    respostaDiv.innerHTML = converter.makeHtml(resposta);
  } catch (err) {
    respostaDiv.innerHTML = `<p style="color:red;"><strong>Erro:</strong> ${err.message}</p>`;
  }
}
