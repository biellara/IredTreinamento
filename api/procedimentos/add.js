import { db } from '../../firebase.js';

export default async function addProcedimento(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { titulo, descricao, passos, tags, departamento, criadoPor } = req.body;

    if (!titulo || !descricao || !passos || !tags) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

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
