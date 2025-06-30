const db = require('../firebase');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Valida JWT
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

  try {
    const simRef = db.collection('simulations').where('userId', '==', decoded.id).orderBy('createdAt', 'desc');
    const snapshot = await simRef.get();

    const simulations = [];

    snapshot.forEach(doc => {
      simulations.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({ simulations });

  } catch (err) {
    console.error('Erro ao buscar simulações:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar simulações.' });
  }
};
