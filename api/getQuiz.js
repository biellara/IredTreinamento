const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // se estiver usando
    projectId: serviceAccount.project_id, // define explicitamente o projectId
  });
}

const { getQuizFromFirestore } = require('../lib/firestore-quiz');

module.exports = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID do quiz não informado.' });

  try {
    const quiz = await getQuizFromFirestore(id);
    if (!quiz) return res.status(404).json({ error: 'Quiz não encontrado.' });
    return res.status(200).json(quiz);
  } catch (error) {
    console.error('Erro ao obter quiz:', error);
    return res.status(500).json({ error: 'Erro ao obter quiz.' });
  }
};