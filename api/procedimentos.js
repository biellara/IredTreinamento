import { db } from '../firebase.js';

export default async function procedimentosHandler(req, res) {
  const metodo = req.method;
  const { action } = req.body || {};

  if (metodo !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // ───────────── ADICIONAR PROCEDIMENTO ─────────────
  if (action === 'add') {
    const { titulo, descricao, passos, tags, departamento, criadoPor } = req.body;

    if (!titulo || !descricao || !passos || !tags) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    try {
      const novoProcedimento = {
        titulo,
        descricao,
        passos,
        tags,
        departamento: departamento || 'Geral',
        dataCriacao: new Date().toISOString(),
        criadoPor: criadoPor || 'sistema'
      };

      await db.collection('procedimentos').add(novoProcedimento);

      return res.status(201).json({ mensagem: 'Procedimento adicionado com sucesso!' });
    } catch (erro) {
      console.error('Erro ao adicionar procedimento:', erro);
      return res.status(500).json({ error: 'Erro ao adicionar o procedimento.' });
    }
  }

  // ───────────── BUSCAR PROCEDIMENTO ─────────────
  if (action === 'search') {
    const { termo } = req.body;

    if (!termo || termo.trim() === '') {
      return res.status(400).json({ error: 'Termo de busca obrigatório' });
    }

    try {
      const termoLower = termo.toLowerCase();

      const snapshot = await db.collection('procedimentos').get();

      const resultados = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(proc => {
          const titulo = proc.titulo?.toLowerCase() || '';
          const tags = (proc.tags || []).map(t => t.toLowerCase());

          return titulo.includes(termoLower) || tags.some(tag => tag.includes(termoLower));
        });

      if (resultados.length === 0) {
        return res.status(404).json({ mensagem: 'Nenhum procedimento encontrado com esse termo.' });
      }

      return res.status(200).json({ resultados });
    } catch (erro) {
      console.error('Erro na busca de procedimentos:', erro);
      return res.status(500).json({ error: 'Erro interno na busca.' });
    }
  }

  // ───────────── ACTION DESCONHECIDA ─────────────
  return res.status(400).json({ error: 'Ação inválida ou não especificada. Use action: "add" ou "search".' });
}
