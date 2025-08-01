(async () => {
  try {
    // Carrega o CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'assistente.css'; // certifique-se que o nome está correto
    document.head.appendChild(cssLink);

    // Carrega a biblioteca Showdown.js
    await new Promise((resolve, reject) => {
      const showdownScript = document.createElement('script');
      showdownScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js';
      showdownScript.onload = resolve;
      showdownScript.onerror = reject;
      document.head.appendChild(showdownScript);
    });

    // Carrega o HTML do assistente
    const htmlResponse = await fetch('assistente.html');
    if (!htmlResponse.ok) throw new Error("Não foi possível carregar assistente.html");
    const html = await htmlResponse.text();
    document.body.insertAdjacentHTML('beforeend', html);

    // Aguarda o DOM ser atualizado e registra o clique do botão flutuante
    const waitForElement = (selector, timeout = 3000) =>
      new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          const element = document.querySelector(selector);
          if (element) {
            clearInterval(interval);
            resolve(element);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(interval);
          reject(`Elemento ${selector} não encontrado`);
        }, timeout);
      });

    const fab = await waitForElement('.tech-assistant-fab');
    fab.addEventListener('click', () => {
      if (window.abrirAssistente) window.abrirAssistente();
    });

    // Carrega o script principal do assistente após tudo estar no lugar
    const jsScript = document.createElement('script');
    jsScript.src = 'assistente.js'; // ou script.js, conforme seu nome
    jsScript.defer = false;
    document.body.appendChild(jsScript);

  } catch (err) {
    console.error("Erro ao carregar assistente:", err);
  }
})();
