const db = require('../../firebase');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Libera CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Resposta para preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Permite apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Extrai token JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token JWT não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('Erro ao verificar JWT:', err);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  // Valida corpo da requisição
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    console.error('Erro ao parsear body:', e);
    return res.status(400).json({ error: 'Corpo da requisição inválido.' });
  }

  const { scenario, chatHistory, feedback } = body;

  if (!scenario || !chatHistory || !Array.isArray(chatHistory)) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes ou inválidos.' });
  }

  // Salva simulação no Firestore
  try {
    const simRef = db.collection('simulations');

    await simRef.add({
      userId: decoded.id,
      scenario: scenario,
      chatHistory: chatHistory,
      feedback: feedback || null,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ message: 'Simulação salva com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar simulação:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar simulação.' });
  }
};
