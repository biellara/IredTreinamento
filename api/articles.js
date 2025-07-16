import { db } from "../firebase.js";

// Gera um slug baseado no título
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s-]/g, "") // remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-"); // substitui espaços por hífens
};

const validateArticleData = (data) => {
  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.trim() === ""
  ) {
    return "O título é obrigatório.";
  }
  if (
    !data.description ||
    typeof data.description !== "string" ||
    data.description.trim() === ""
  ) {
    return "A descrição é obrigatória.";
  }
  if (
    !data.content ||
    typeof data.content !== "string" ||
    data.content.trim() === ""
  ) {
    return "O conteúdo é obrigatório.";
  }
  return null;
};

async function createArticle(req, res) {
  const data = req.body;
  const validationError = validateArticleData(data);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const slug = generateSlug(data.title);

    const newArticle = {
      id: slug,
      title: data.title,
      description: data.description,
      content: data.content,
      file: `deep-dives/${slug}.md`,
      icon: "fa-microscope",
      category: "Artigos Aprofundados",
      type: data.type === "knowledgeBase" ? "knowledgeBase" : "activity",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("content").doc(slug).set(newArticle);
    res.status(201).json(newArticle);
  } catch (error) {
    console.error("Erro ao criar artigo:", error);
    res.status(500).json({ error: "Erro interno ao criar artigo." });
  }
}

async function getArticles(req, res) {
  try {
    const { id } = req.query;

    if (id) {
      const doc = await db.collection("content").doc(id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Artigo não encontrado." });
      return res.status(200).json(doc.data());
    }

    const snapshot = await db
      .collection("content")
      .orderBy("createdAt", "desc")
      .get();
    const articles = snapshot.docs.map((doc) => doc.data());
    res.status(200).json(articles);
  } catch (error) {
    console.error("Erro ao obter artigos:", error);
    res.status(500).json({ error: "Erro interno ao buscar artigos." });
  }
}

async function updateArticle(req, res) {
  const { id } = req.query;
  const data = req.body;
  if (!id)
    return res.status(400).json({ error: "ID do artigo é obrigatório." });

  const validationError = validateArticleData(data);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const docRef = db.collection("content").doc(id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ error: "Artigo não encontrado." });

    const updatedData = {
      ...doc.data(),
      title: data.title,
      description: data.description,
      content: data.content,
      updatedAt: new Date(),
    };

    await docRef.set(updatedData);
    res.status(200).json(updatedData);
  } catch (error) {
    console.error("Erro ao atualizar artigo:", error);
    res.status(500).json({ error: "Erro interno ao atualizar artigo." });
  }
}

async function deleteArticle(req, res) {
  const { id } = req.query;
  if (!id)
    return res.status(400).json({ error: "ID do artigo é obrigatório." });

  try {
    await db.collection("content").doc(id).delete();
    res.status(200).json({ message: "Artigo excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir artigo:", error);
    res.status(500).json({ error: "Erro interno ao excluir artigo." });
  }
}

export default async function handler(req, res) {
  switch (req.method) {
    case "GET":
      return await getArticles(req, res);
    case "POST":
      return await createArticle(req, res);
    case "PUT":
      return await updateArticle(req, res);
    case "DELETE":
      return await deleteArticle(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).end(`Método ${req.method} não permitido`);
  }
}
