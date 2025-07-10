// Ficheiro: /api/quizzes.js

const { db } = require('../firebase'); // Importa a instância do Firestore
const jwt = require('jsonwebtoken');

// --- Handler Principal da API ---
module.exports = async (req, res) => {
  // --- Configuração de CORS e resposta para OPTIONS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- Autenticação e Verificação de Função (Role) ---
  let decodedToken;
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  const userRole = decodedToken.role;
  const userId = decodedToken.id;
  const { id } = req.query; // ID do quiz para GET, PUT, DELETE

  // --- Roteamento baseado no Método HTTP ---
  switch (req.method) {
    // --- LISTAR QUIZZES (acessível a todos os utilizadores logados) ---
    case 'GET':
      try {
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
        console.error("Erro ao buscar quiz(zes):", error);
        return res.status(500).json({ error: 'Erro interno ao buscar quizzes.' });
      }

    // --- CRIAR QUIZ OU SUBMETER RESULTADO ---
    case 'POST':
      const { action } = req.query;

      // --- Submeter um resultado de quiz ---
      if (action === 'submit') {
        try {
          const { quizId, answers, score } = req.body;
          if (!quizId || !Array.isArray(answers) || typeof score !== 'number') {
            return res.status(400).json({ error: 'Dados da submissão inválidos.' });
          }
          const result = {
            quizId,
            answers,
            score,
            userId: userId,
            userEmail: decodedToken.email,
            submittedAt: new Date().toISOString()
          };
          await db.collection('quizResults').add(result);
          return res.status(200).json({ message: 'Resultado salvo com sucesso.' });
        } catch (err) {
          console.error('Erro ao salvar resultado do quiz:', err);
          return res.status(500).json({ error: 'Erro interno ao salvar o resultado.' });
        }
      } 
      // --- Criar um novo quiz (apenas admin) ---
else {
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Permissões de administrador necessárias.' });
  }

  try {
    const { title, description, questions } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Título e pelo menos uma pergunta são obrigatórios.' });
    }

    // Normaliza as perguntas
    const normalizedQuestions = questions.map((q, index) => {
      if (
        typeof q.question !== 'string' ||
        typeof q.answer !== 'string' ||
        !Array.isArray(q.options) ||
        q.options.length < 2
      ) {
        throw new Error(`Pergunta inválida na posição ${index + 1}`);
      }

      return {
        question: q.question.trim(),
        answer: q.answer.trim(),
        options: q.options.map(opt => String(opt).trim())
      };
    });

    const newQuiz = {
      title: title.trim(),
      description: description?.trim() || '',
      questions: normalizedQuestions,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('quizzes').add(newQuiz);

    return res.status(201).json({ id: docRef.id, ...newQuiz });

  } catch (error) {
    console.error("Erro ao criar quiz:", error);
    return res.status(500).json({ error: 'Erro interno ao criar quiz.' });
  }
}


    // --- ATUALIZAR UM QUIZ (apenas admin) ---
    case 'PUT':
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Permissões de administrador necessárias.' });
      }
      if (!id) {
        return res.status(400).json({ error: 'O ID do quiz é obrigatório para atualização.' });
      }
      try {
        const { title, description, questions } = req.body;
        const updatedData = { title, description, questions };
        await db.collection('quizzes').doc(id).update(updatedData);
        return res.status(200).json({ message: 'Quiz atualizado com sucesso.' });
      } catch (error) {
        console.error("Erro ao atualizar quiz:", error);
        return res.status(500).json({ error: 'Erro interno ao atualizar quiz.' });
      }

    // --- EXCLUIR UM QUIZ (apenas admin) ---
    case 'DELETE':
      if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Permissões de administrador necessárias.' });
      }
      if (!id) {
        return res.status(400).json({ error: 'O ID do quiz é obrigatório para exclusão.' });
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
