const db = require('../firebase');
const verifyToken = require('../middleware/verifyToken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { decoded, error, status } = verifyToken(req, res);
  if (error) return res.status(status).json({ error });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  const { quizId, answers, score } = body;

  if (!quizId || !Array.isArray(answers) || typeof score !== 'number') {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    const result = {
      quizId,
      answers,
      score,
      userEmail: decoded.email,
      submittedAt: new Date().toISOString()
    };

    await db.collection('quizResults').add(result);

    return res.status(200).json({ message: 'Resultado salvo com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar resultado:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
