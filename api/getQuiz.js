// Nome do arquivo sugerido: /api/quizzes.js

const admin = require('firebase-admin');
// Importe as funções do seu arquivo de acesso ao Firestore
const { getQuizFromFirestore, getAllQuizzesFromFirestore } = require('../lib/firestore-quiz'); 
// Importe seu middleware de verificação de token
const verifyToken = require('./middleware/verifyToken');

// --- Inicialização do Firebase Admin SDK ---
// Garante que a inicialização ocorra apenas uma vez.
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (error) {
    console.error('Falha ao inicializar o Firebase Admin SDK:', error);
  }
}

// Obtenha a instância do Firestore a partir do admin inicializado
const db = admin.firestore();

// --- Handler Principal da API ---
// Este único handler vai gerenciar as duas lógicas (GET e POST).
module.exports = async (req, res) => {
  // --- LÓGICA PARA BUSCAR QUIZZES (MÉTODO GET) ---
  if (req.method === 'GET') {
    const { id } = req.query;
    try {
      // Se um 'id' for fornecido, busca um único quiz.
      if (id) {
        const quiz = await getQuizFromFirestore(id);
        if (!quiz) {
          return res.status(404).json({ error: 'Quiz não encontrado.' });
        }
        return res.status(200).json(quiz);
      } 
      // Se NENHUM 'id' for fornecido, busca todos os quizzes.
      else {
        const quizzes = await getAllQuizzesFromFirestore();
        return res.status(200).json(quizzes);
      }
    } catch (error) {
      console.error('Erro ao obter quiz(zes):', error);
      return res.status(500).json({ error: 'Ocorreu um erro interno ao buscar quizzes.' });
    }
  }

  // --- LÓGICA PARA SALVAR RESULTADOS (MÉTODO POST) ---
  if (req.method === 'POST') {
    // 1. Verificar autenticação do usuário
    const { decoded, error, status } = verifyToken(req);
    if (error) {
      return res.status(status).json({ error });
    }

    try {
      // 2. Validar os dados recebidos
      const { quizId, answers, score } = req.body;
      if (!quizId || !Array.isArray(answers) || typeof score !== 'number') {
        return res.status(400).json({ error: 'Dados da requisição inválidos ou incompletos.' });
      }

      // 3. Montar o objeto a ser salvo
      const result = {
        quizId,
        answers,
        score,
        userId: decoded.uid, // Usar o UID do token decodificado
        userEmail: decoded.email,
        submittedAt: new Date().toISOString() // Usar timestamp do servidor
      };

      // 4. Salvar no Firestore
      await db.collection('quizResults').add(result);

      return res.status(200).json({ message: 'Resultado salvo com sucesso.' });

    } catch (err) {
      console.error('Erro ao salvar resultado do quiz:', err);
      return res.status(500).json({ error: 'Ocorreu um erro interno ao salvar o resultado.' });
    }
  }

  // Se o método não for GET nem POST, retorna erro.
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};
