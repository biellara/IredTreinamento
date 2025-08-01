(() => {
  const converter = new showdown.Converter();
  let conversationHistory = [];

  const modalAssistente         = document.getElementById('modalAssistente');
  const chatContainer           = document.getElementById('chatContainer');
  const mensagemAssistenteInput = document.getElementById('mensagemAssistente');
  const btnEnviarAssistente     = document.getElementById('btnEnviarAssistente');
  const sendIcon                = btnEnviarAssistente.querySelector('i');

  function abrirAssistente() {
    modalAssistente?.classList.add('show');
  }

  function fecharAssistente() {
    modalAssistente?.classList.remove('show');
  }

  function adicionarMensagemAoChat(text, sender) {
    if (!chatContainer) return;
    const loadingBubble = chatContainer.querySelector(".chat-message.loading");
    loadingBubble?.remove();

    const msgEl = document.createElement("div");
    msgEl.classList.add("chat-message", sender);
    msgEl.innerHTML = sender === "assistant"
      ? converter.makeHtml(text)
      : text;
    chatContainer.appendChild(msgEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function configurarEnvio() {
    if (!btnEnviarAssistente || !mensagemAssistenteInput) return;

    async function lidarComEnvio() {
      const pergunta = mensagemAssistenteInput.value.trim();
      if (!pergunta) return;

      conversationHistory.push({ role: "user", parts: [{ text: pergunta }] });
      adicionarMensagemAoChat(pergunta, "user");
      mensagemAssistenteInput.value = "";

      // desabilita botão e mostra spinner
      btnEnviarAssistente.disabled = true;
      sendIcon.classList.replace('fa-paper-plane', 'fa-spinner');
      sendIcon.classList.add('fa-spin');
      adicionarMensagemAoChat("Digitando...", "loading");

      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: conversationHistory }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(`API ${res.status}: ${err.error || res.statusText}`);
        }

        const { candidates } = await res.json();
        const textoResposta = candidates?.[0]?.content?.parts?.[0]?.text;

        if (textoResposta) {
          conversationHistory.push({ role: "model", parts: [{ text: textoResposta }] });
          adicionarMensagemAoChat(textoResposta, "assistant");
        } else {
          adicionarMensagemAoChat("Erro: resposta inesperada.", "assistant");
        }

      } catch {
        adicionarMensagemAoChat("Erro na comunicação com o servidor.", "assistant");
      } finally {
        // restaura ícone e reativa botão
        sendIcon.classList.remove('fa-spin');
        sendIcon.classList.replace('fa-spinner', 'fa-paper-plane');
        btnEnviarAssistente.disabled = false;
        mensagemAssistenteInput.focus();
      }
    }

    mensagemAssistenteInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        lidarComEnvio();
      }
    });

    btnEnviarAssistente.addEventListener("click", lidarComEnvio);
  }

  function configurarEventos() {
    document.querySelector('.modal-header button')?.addEventListener('click', fecharAssistente);
    configurarEnvio();
  }

  window.addEventListener('click', e => {
    if (e.target === modalAssistente) fecharAssistente();
  });

  window.abrirAssistente  = abrirAssistente;
  window.fecharAssistente = fecharAssistente;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", configurarEventos);
  } else {
    configurarEventos();
  }
})();
