import { db } from '../../firebase.js';

export default async function searchProcedimentos(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { termo } = req.body;

    if (!termo || termo.trim() === '') {
      return res.status(400).json({ error: 'Termo de busca obrigatório' });
    }

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
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}
