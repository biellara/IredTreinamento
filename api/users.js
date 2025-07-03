const { db, auth } = require('../firebase'); 

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// --- Handler Principal da API ---
module.exports = async (req, res) => {
  // --- Configuração de CORS e resposta para OPTIONS (Preflight) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- Middleware de Autenticação e Verificação de Função (Role) ---
  try {
    // --- LOG DE DEPURAÇÃO ADICIONADO ---
    // Vamos verificar se a JWT_SECRET está a ser carregada corretamente aqui.
    console.log('[API de Utilizadores] Verificando token com JWT_SECRET:', process.env.JWT_SECRET ? `...${process.env.JWT_SECRET.slice(-6)}` : 'NÃO DEFINIDA');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Busca o utilizador no Firestore para verificar a sua função
    const userDoc = await db.collection('users').doc(decodedToken.id).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Permissões de administrador necessárias.' });
    }
  } catch (error) {
    // Adiciona um log do erro para mais detalhes na depuração
    console.error('[API de Utilizadores] Erro na verificação do token:', error.message);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  // --- Roteamento baseado no Método HTTP ---
  switch (req.method) {
    case 'GET':
      // --- Listar todos os utilizadores ---
      try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => {
          const { password, ...userData } = doc.data(); // Exclui a senha do retorno
          return { id: doc.id, ...userData };
        });
        return res.status(200).json(users);
      } catch (error) {
        console.error("Erro ao listar utilizadores:", error);
        return res.status(500).json({ error: 'Erro interno ao buscar utilizadores.' });
      }

    case 'POST':
      // --- Criar um novo utilizador ---
      try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password || !role) {
          return res.status(400).json({ error: 'Campos obrigatórios em falta: username, email, password, role.' });
        }

        const userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: username,
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').doc(userRecord.uid).set({
          username,
          email,
          role,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
        });

        return res.status(201).json({ id: userRecord.uid, message: 'Utilizador criado com sucesso.' });
      } catch (error) {
        console.error("Erro ao criar utilizador:", error);
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ error: 'O e-mail fornecido já está em uso.' });
        }
        return res.status(500).json({ error: 'Erro interno ao criar utilizador.' });
      }

    case 'PUT':
      // --- Atualizar a função de um utilizador ---
      try {
        const { id } = req.query;
        const { role } = req.body;
        if (!id || !role) {
          return res.status(400).json({ error: 'ID do utilizador e a nova função (role) são obrigatórios.' });
        }

        await db.collection('users').doc(id).update({ role });
        return res.status(200).json({ message: 'Função do utilizador atualizada com sucesso.' });
      } catch (error) {
        console.error("Erro ao atualizar utilizador:", error);
        return res.status(500).json({ error: 'Erro interno ao atualizar utilizador.' });
      }

    case 'DELETE':
      // --- Excluir um utilizador ---
      try {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'O ID do utilizador é obrigatório.' });
        }

        await auth.deleteUser(id);
        await db.collection('users').doc(id).delete();

        return res.status(200).json({ message: 'Utilizador excluído com sucesso.' });
      } catch (error) {
        console.error("Erro ao excluir utilizador:", error);
        return res.status(500).json({ error: 'Erro interno ao excluir utilizador.' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      // CORREÇÃO: A linha abaixo estava incompleta, causando um erro de sintaxe.
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
