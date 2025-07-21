
const { db } = require('../firebase');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  const userRole = decodedToken.role;
  const userId = decodedToken.id;
  const { id, view, action } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        if (view === 'results') {
          let query;
          if (userRole !== 'admin') {
            query = db.collection('quizResults').where('userId', '==', userId);
          } else {
            query = db.collection('quizResults');
          }
          const resultsSnapshot = await query.orderBy('submittedAt', 'desc').get();
          const results = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          return res.status(200).json(results);
        }
        
        if (id) {
          const doc = await db.collection('quizzes').doc(id).get();
          if (!doc.exists) {
            return res.status(404).json({ error: 'Quiz não encontrado.' });
          }
          return res.status(200).json({ id: doc.id, ...doc.data() });
        } else {
          const querySnapshot = await db.collection('quizzes').orderBy('createdAt', 'desc').get();
          const quizzes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          return res.status(200).json(quizzes);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        return res.status(500).json({ error: 'Erro interno ao buscar dados.' });
      }

    case 'POST':
      if (action === 'submit') {
        try {
          const { quizId, answers, score } = req.body;
          if (!quizId || !Array.isArray(answers) || typeof score !== 'number') {
            return res.status(400).json({ error: 'Dados da submissão inválidos.' });
          }
          const result = {
            quizId, answers, score, userId,
            userEmail: decodedToken.email,
            submittedAt: new Date().toISOString()
          };
          await db.collection('quizResults').add(result);
          return res.status(200).json({ message: 'Resultado salvo com sucesso.' });
        } catch (err) {
          console.error('Erro ao salvar resultado do quiz:', err);
          return res.status(500).json({ error: 'Erro interno ao salvar o resultado.' });
        }
      } else {
        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        try {
            const { title, description, questions } = req.body;
            if (!title || !Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({ error: 'Título e perguntas são obrigatórios.' });
            }
            const newQuiz = {
                title,
                description: description || '',
                questions,
                createdAt: new Date().toISOString()
            };
            const docRef = await db.collection('quizzes').add(newQuiz);
            return res.status(201).json({ id: docRef.id, ...newQuiz });
        } catch(error) {
            console.error("Erro ao criar quiz:", error);
            return res.status(500).json({ error: 'Erro interno ao criar quiz.' });
        }
      }

    case 'PUT':
        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        if (!id) {
            return res.status(400).json({ error: 'O ID do quiz é obrigatório.' });
        }
        try {
            const { title, description, questions } = req.body;
            if (!title || !Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({ error: 'Dados inválidos para atualização.' });
            }
            const updatedData = { title, description, questions };
            await db.collection('quizzes').doc(id).update(updatedData);
            return res.status(200).json({ message: 'Quiz atualizado com sucesso.' });
        } catch (error) {
            console.error("Erro ao atualizar quiz:", error);
            return res.status(500).json({ error: 'Erro interno ao atualizar quiz.' });
        }

    case 'DELETE':
        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        if (!id) {
            return res.status(400).json({ error: 'O ID do quiz é obrigatório.' });
        }
        try {
            await db.collection('quizzes').doc(id).delete();
            return res.status(200).json({ message: 'Quiz excluído com sucesso.' });
        } catch (error) {
            console.error("Erro ao excluir quiz:", error);
            return res.status(500).json({ error: 'Erro interno ao excluir quiz.' });
        }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
