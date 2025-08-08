// api/procedimentos.js
import jwt from "jsonwebtoken";
import { db } from "../firebase.js";

function resolveUserJWT(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      uid: decoded.id || null,
      email: decoded.email || null,
      nome: decoded.name || decoded.email?.split("@")[0] || null,
      role: decoded.role || null,
    };
  } catch (e) {
    console.warn("JWT inválido:", e?.message);
    return null;
  }
}


function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function procedimentosHandler(req, res) {
  const metodo = req.method;
  const body = getBody(req);
  const { action } = body || {};

  if (metodo !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // ───────────────────────── LISTAR TODOS ─────────────────────────
  if (action === "list") {
    try {
      const snapshot = await db.collection("procedimentos").get();
      const procedimentos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json(procedimentos);
    } catch (erro) {
      console.error("Erro ao listar procedimentos:", erro);
      return res
        .status(500)
        .json({ error: "Erro ao listar os procedimentos." });
    }
  }

  // ───────────────────────── ADD / UPDATE ─────────────────────────
  if (action === "add" || action === "update") {
    const { id, titulo, descricao, conteudo, passos, tags } = body || {};

    const temConteudo =
      typeof conteudo === "string" && conteudo.trim().length > 0;
    const temPassos = Array.isArray(passos) && passos.length > 0;

    if (!titulo || !descricao || !Array.isArray(tags) || !(temConteudo || temPassos)) {
      return res.status(400).json({
        error:
          "Campos obrigatórios faltando (titulo, descricao, tags e conteudo OU passos).",
      });
    }

    // Migração de passos -> texto numerado (uma linha por passo)
    const finalConteudo = temConteudo
      ? conteudo.trim()
      : passos.map((s, i) => `${i + 1}. ${s}`).join("\n");

    const tagsNormalizadas = (tags || [])
      .map((t) => (typeof t === "string" ? t.trim() : t))
      .filter(Boolean);

    const agoraISO = new Date().toISOString();
    const user = resolveUserJWT(req);
    const metaUser = user
      ? { uid: user.uid, email: user.email, nome: user.nome }
      : null;

    try {
      if (id) {
        // UPDATE: não sobrescreve criador; registra somente quem atualizou
        const atualizar = {
          titulo,
          descricao,
          conteudo: finalConteudo,
          tags: tagsNormalizadas,
          dataAtualizacao: agoraISO,
        };
        if (metaUser) atualizar.atualizadoPor = metaUser;

        await db.collection("procedimentos").doc(id).update(atualizar);
        return res
          .status(200)
          .json({ mensagem: "Procedimento atualizado com sucesso!" });
      } else {
        // ADD: define criador real + timestamps
        const novo = {
          titulo,
          descricao,
          conteudo: finalConteudo,
          tags: tagsNormalizadas,
          dataCriacao: agoraISO,
          dataAtualizacao: agoraISO,
        };

        if (metaUser) {
          novo.criadoPor = metaUser; // objeto com uid/email/nome
          novo.criadoPorEmail = metaUser.email || "";
        }

        await db.collection("procedimentos").add(novo);
        return res
          .status(201)
          .json({ mensagem: "Procedimento adicionado com sucesso!" });
      }
    } catch (erro) {
      console.error("Erro ao salvar procedimento:", erro);
      return res
        .status(500)
        .json({ error: "Erro ao salvar o procedimento." });
    }
  }

  // ───────────────────────── BUSCAR POR TERMO ─────────────────────────
  if (action === "search") {
    const { termo } = body || {};

    if (!termo || termo.trim() === "") {
      return res.status(400).json({ error: "Termo de busca obrigatório" });
    }

    try {
      const termoLower = termo.toLowerCase();
      const snapshot = await db.collection("procedimentos").get();

      const resultados = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((proc) => {
          const titulo = (proc.titulo || "").toLowerCase();
          const descricao = (proc.descricao || "").toLowerCase();
          const conteudoDoc = (proc.conteudo || "").toLowerCase();
          const tags = (proc.tags || []).map((t) => (t || "").toLowerCase());
          return (
            titulo.includes(termoLower) ||
            descricao.includes(termoLower) ||
            conteudoDoc.includes(termoLower) ||
            tags.some((tag) => tag.includes(termoLower))
          );
        });

      if (resultados.length === 0) {
        return res
          .status(404)
          .json({ mensagem: "Nenhum procedimento encontrado com esse termo." });
      }

      return res.status(200).json({ resultados });
    } catch (erro) {
      console.error("Erro na busca de procedimentos:", erro);
      return res.status(500).json({ error: "Erro interno na busca." });
    }
  }

  // ───────────────────────── EXCLUIR ─────────────────────────
  if (action === "delete") {
    const { id } = body || {};
    if (!id)
      return res
        .status(400)
        .json({ error: "ID do procedimento é obrigatório para exclusão." });

    try {
      await db.collection("procedimentos").doc(id).delete();
      return res
        .status(200)
        .json({ mensagem: "Procedimento excluído com sucesso!" });
    } catch (erro) {
      console.error("Erro ao excluir procedimento:", erro);
      return res
        .status(500)
        .json({ error: "Erro ao excluir o procedimento." });
    }
  }

  // ───────────────────────── DEFAULT ─────────────────────────
  return res.status(400).json({
    error:
      'Ação inválida ou não especificada. Use action: "add", "update", "list", "search" ou "delete".',
  });
}
