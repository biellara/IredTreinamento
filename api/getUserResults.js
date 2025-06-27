const db = require('../firebase');
const verifyToken = require('./middleware/verifyToken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const decoded = verifyToken(req);
    const userEmail = decoded.email;

    const snapshot = await db
      .collection('quizResponses')
      .where('userEmail', '==', userEmail)
      //.orderBy('timestamp', 'desc')//
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ results: [] });
    }

    const results = snapshot.docs.map(doc => doc.data());

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};
