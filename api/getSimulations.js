// Ficheiro: /api/simulations.js

const { db } = require('../firebase'); // Ajuste o caminho se necessário
const jwt = require('jsonwebtoken');

// --- Handler Principal da API ---
module.exports = async (req, res) => {
  // --- Configuração de CORS e resposta para OPTIONS (Preflight) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- Autenticação (Comum a todos os métodos) ---
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

  // --- Roteamento baseado no Método HTTP ---

  // ======================================================
  //  MÉTODO POST: Salvar uma nova simulação
  // ======================================================
  if (req.method === 'POST') {
    try {
      const { scenario, chatHistory, feedback } = req.body;

      if (!scenario || !chatHistory || !Array.isArray(chatHistory)) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes ou inválidos.' });
      }

      const newSimulation = {
        userId: decoded.id, // ID do utilizador vindo do token
        scenario,
        chatHistory,
        feedback: feedback || null,
        createdAt: new Date().toISOString(),
      };

      await db.collection('simulations').add(newSimulation);
      return res.status(201).json({ message: 'Simulação salva com sucesso.' });

    } catch (err) {
      console.error('Erro ao salvar simulação:', err);
      return res.status(500).json({ error: 'Erro interno ao salvar simulação.' });
    }
  }

  // ======================================================
  //  MÉTODO GET: Buscar simulações
  // ======================================================
  if (req.method === 'GET') {
    try {
      const { view, scenario, start, end } = req.query;

      const enrichSimulationWithUserData = async (doc) => {
          const data = doc.data();
          let userData = { username: 'Utilizador Desconhecido' };
          if (data.userId) {
              try {
                  const userDoc = await db.collection('users').doc(data.userId).get();
                  if (userDoc.exists) {
                      userData = { username: userDoc.data().username || 'Nome não definido' };
                  }
              } catch (userError) {
                  console.error(`Erro ao buscar utilizador ${data.userId}:`, userError);
              }
          }
          return { id: doc.id, ...data, ...userData };
      };

      let query;
      // Visão de Administrador/Relatório (com filtros)
      if (view === 'admin') {
        query = db.collection('simulations');
        if (scenario) query = query.where('scenario', '==', scenario);
        if (start) query = query.where('createdAt', '>=', start);
        if (end) query = query.where('createdAt', '<=', end);
      } 
      // Visão Padrão (simulações do próprio utilizador)
      else {
        query = db.collection('simulations').where('userId', '==', decoded.id);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      if (snapshot.empty) {
          return res.status(200).json({ simulations: [] });
      }

      const simulationsPromises = snapshot.docs.map(enrichSimulationWithUserData);
      const simulations = await Promise.all(simulationsPromises);
      
      return res.status(200).json({ simulations });

    } catch (err) {
      console.error('Erro ao buscar simulações:', err);
      return res.status(500).json({ error: 'Erro interno ao buscar simulações.' });
    }
  }

  // Se o método não for GET nem POST, retorna o erro 405
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
