const { db } = require('../firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, novaSenha } = req.body;

    if (!userId || !novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ error: 'Dados inválidos ou senha muito curta.' });
    }

    if (decoded.id !== userId) {
      return res.status(403).json({ error: 'Usuário não autorizado.' });
    }

    const hashedSenha = await bcrypt.hash(novaSenha, 10);

    await db.collection('users').doc(userId).update({
      password: hashedSenha,
      senhaTemporaria: false
    });

    res.status(200).json({ message: 'Senha atualizada com sucesso.' });

  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
