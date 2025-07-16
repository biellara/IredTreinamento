document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("id");

  const titulo = document.getElementById("titulo-artigo");
  const descricao = document.getElementById("descricao-artigo");
  const conteudo = document.getElementById("conteudo-artigo");

  if (!slug) {
    titulo.textContent = "Artigo não especificado";
    return;
  }

  try {
    const response = await fetch(`/api/articles?id=${slug}`);
    if (!response.ok) throw new Error("Artigo não encontrado.");

    const artigo = await response.json();
    const converter = new showdown.Converter({
      tables: true,
      strikethrough: true,
      simpleLineBreaks: true,
      emojis: true,
      ghCompatibleHeaderId: true,
      parseImgDimensions: true,
      openLinksInNewWindow: true,
      backslashEscapesHTMLTags: false, //
    });

    titulo.textContent = artigo.title;
    descricao.textContent = artigo.description;
    conteudo.innerHTML = converter.makeHtml(artigo.content);
  } catch (err) {
    titulo.textContent = "Erro ao carregar artigo";
    conteudo.innerHTML = `<p style="color: red;">${err.message}</p>`;
  }
});
