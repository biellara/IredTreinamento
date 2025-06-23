const { getAllQuizzesFromFirestore } = require('../lib/firestore-quiz');

module.exports = async (req, res) => {
  try {
    const quizzes = await getAllQuizzesFromFirestore();
    return res.status(200).json(quizzes);
  } catch (error) {
    console.error('Erro ao obter quizzes:', error);
    return res.status(500).json({ error: 'Erro ao obter quizzes.' });
  }
};
