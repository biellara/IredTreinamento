// gemini.js — versão concisa (Ired + Conteúdo)
// Responde colaboradores internos da Ired Internet usando APENAS o Conteúdo dos procedimentos.
// Inclui fallback conciso e contextualizado (Ired + SAC) quando não houver procedimento aplicável.

const fetch = require("node-fetch");
const { db } = require("../firebase.js"); // Certifique-se que está usando CommonJS se for .js

// ---- Contexto da empresa para o fallback
const companyProfile = {
  nome: "Ired Internet",
  tipo: "provedora de internet (FTTH)",
  setor: "SAC",
};

// Prompt de fallback quando não há procedimento aplicável
function buildFallbackPrompt(pergunta) {
  return `
Você é um Analista Sênior do **SAC da ${companyProfile.nome}**, uma **${companyProfile.tipo}**. 
Nenhum procedimento interno aplicável foi encontrado para a solicitação abaixo. 
Responda de forma **concisa**, adequada ao contexto de um SAC de ISP FTTH regional.

Pergunta do colaborador:
"""
${pergunta}
"""

O que fazer:
- Forneça **Orientação geral (não oficial)** para que o atendente consiga encaminhar o caso com segurança.
- Liste rapidamente **dados/validações** que faltam para documentar o procedimento oficial (ex.: dados do cliente, checagens no sistema, prazos, aprovações).
- Recomende **abrir solicitação** para criação/atualização do procedimento na base interna.

Formato da resposta:
- **Título curto**
- **Passos numerados** (claros e objetivos)
- **Observações** (se houver)
- **Selo**: "Orientação geral (não oficial) — valide com N2/gestão"
`.trim();
}

module.exports = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key não configurada." });
  }

  // Verifica se a requisição vem do assistente virtual
  if (req.body?.assistente === true) {
    const pergunta = req.body.pergunta;
    if (!pergunta || pergunta.trim() === "") {
      return res.status(400).json({ error: "Pergunta obrigatória" });
    }

    try {
      // 1. Busca procedimento no Firestore
      const termo = pergunta.toLowerCase();
      const snapshot = await db.collection("procedimentos").get();

      const resultados = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((proc) => {
          const titulo = proc.titulo?.toLowerCase() || "";
          // tags pode vir string ou array
          const tagsArr = Array.isArray(proc.tags)
            ? proc.tags
            : typeof proc.tags === "string"
            ? proc.tags.split(",")
            : [];
          const tags = tagsArr.map((t) => String(t).toLowerCase().trim()).filter(Boolean);

          return (
            titulo.includes(termo) ||
            tags.some((tag) => termo.includes(tag)) ||
            (proc.descricao?.toLowerCase() || "").includes(termo) ||
            (proc.conteudo?.toLowerCase() || "").includes(termo)
          );
        });

      if (resultados.length > 0) {
        // Monta prompt com os procedimentos encontrados para que a IA selecione o mais apropriado
        const prompt = `
Você é um Analista Sênior de SAC de um provedor de internet, responsável por orientar atendentes menos experientes.
Sua função é responder com base APENAS nos procedimentos internos listados abaixo, explicando de forma clara e precisa como o atendente deve executar o processo e repassar as informações corretas para o cliente.

Regras importantes:
- Não invente informações que não estejam no procedimento escolhido.
- Não misture informações de procedimentos diferentes.
- Use exclusivamente o **Conteúdo** do procedimento escolhido (título/descrição servem apenas como contexto).
- Adapte o texto para que seja fácil de seguir, evitando erros e desencontros de informações.
- Se o conteúdo não estiver em formato de passos, organize-o em uma sequência lógica (sem criar etapas novas).
- Caso nenhum procedimento atenda à solicitação, diga claramente que não há instruções disponíveis e explique o que está faltando.

Pergunta do atendente:
"""
${pergunta}
"""

Procedimentos disponíveis:
${resultados.slice(0, 5).map((p, i) => {
  const conteudo = (p.conteudo ?? "").trim();
  return `Procedimento ${i + 1}:
Título: ${p.titulo ?? ""}
Descrição: ${p.descricao ?? ""}
Conteúdo:
${conteudo || "(sem conteúdo)"}`;
}).join("\n\n")}

Como agir:
1. Leia todos os procedimentos e escolha apenas **um** (o mais adequado e específico para a pergunta).
2. Reescreva as instruções de forma que o atendente saiba exatamente o que fazer e o que perguntar ao cliente, na ordem correta.
3. Se o conteúdo citar alertas, limitações, prazos ou exceções, destaque-os para evitar erros no atendimento.
4. Se o conteúdo exigir dados de validação (ex.: documentos, endereço, credenciais), explique claramente como coletá-los do cliente.
5. Se não houver procedimento aplicável, informe que **não existe instrução cadastrada** para esse caso e liste **quais dados/instruções faltam** para que seja possível documentar o processo.

Agora, elabore a resposta de forma clara, como se estivesse orientando um atendente do SAC.
`;

        const promptGemini = {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(promptGemini),
          }
        );

        const data = await response.json();
        const texto =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "IA não respondeu.";
        return res.status(200).json({ resposta: `🤖 ${texto}` });
      }

      // 2. Caso não encontre, usa fallback COM CONTEXTO Ired + SAC
      const promptFallback = buildFallbackPrompt(pergunta);
      const promptGemini = {
        contents: [
          {
            role: "user",
            parts: [{ text: promptFallback }],
          },
        ],
      };

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(promptGemini),
          }
        );

        const data = await response.json();
        const texto =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "IA não respondeu.";
        return res.status(200).json({ resposta: `🤖 ${texto}` });
      } catch (erroIA) {
        return res.status(500).json({
          error: "Erro ao consultar IA Gemini (fallback).",
          detalhe: erroIA.message,
        });
      }
    } catch (erroProc) {
      console.error("Erro ao consultar procedimentos:", erroProc);
      return res.status(500).json({ error: "Erro ao buscar procedimentos." });
    }
  }

  // Se não for assistente, segue a lógica padrão original
  let contents;
  try {
    const bodyData = req.body;
    const history = Array.isArray(bodyData.history) ? bodyData.history : [];
    const newContents = Array.isArray(bodyData.contents)
      ? bodyData.contents
      : [];

    contents = history.concat(newContents);

    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error(
        "Formato inválido de conteúdo. Esperado um array não vazio."
      );
    }
  } catch (parseError) {
    return res.status(400).json({
      error: "Corpo da requisição inválido.",
      detalhe: parseError.message,
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
