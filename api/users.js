// Ficheiro: /api/users.js

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    const userDoc = await db.collection('users').doc(decodedToken.id).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Permissões de administrador necessárias.' });
    }
  } catch (error) {
    console.error('[API de Utilizadores] Erro na verificação do token:', error.message);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  // --- Roteamento baseado no Método HTTP ---
  switch (req.method) {
    case 'GET':
      try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => {
          const { password, ...userData } = doc.data();
          return { id: doc.id, ...userData };
        });
        return res.status(200).json(users);
      } catch (error) {
        console.error("Erro ao listar utilizadores:", error);
        return res.status(500).json({ error: 'Erro interno ao buscar utilizadores.' });
      }

    case 'POST':
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
      // --- LÓGICA DE ATUALIZAÇÃO CORRIGIDA E MAIS ROBUSTA ---
      try {
        const { id } = req.query; // ID do utilizador a ser atualizado
        const { username, role } = req.body; // Obtém o username e a role do corpo da requisição

        if (!id) {
          return res.status(400).json({ error: 'O ID do utilizador é obrigatório.' });
        }

        // Cria um objeto para armazenar os campos que serão atualizados no Firestore
        const fieldsToUpdateInFirestore = {};
        if (username) fieldsToUpdateInFirestore.username = username;
        if (role) fieldsToUpdateInFirestore.role = role;

        if (Object.keys(fieldsToUpdateInFirestore).length === 0) {
          return res.status(400).json({ error: 'Nenhum dado para atualizar foi fornecido (username ou role).' });
        }

        // Tenta atualizar o Firebase Authentication primeiro, se houver um username
        if (username) {
          try {
            await auth.updateUser(id, { displayName: username });
          } catch (authError) {
            // Se o utilizador não for encontrado na Autenticação, regista um aviso mas continua para atualizar o Firestore.
            // Isto lida com casos de inconsistência de dados.
            if (authError.code === 'auth/user-not-found') {
              console.warn(`AVISO: O utilizador com ID ${id} foi encontrado no Firestore, mas não no Firebase Authentication. O displayName não será atualizado na autenticação.`);
            } else {
              // Se for outro erro de autenticação, lança-o para ser tratado pelo catch principal.
              throw authError;
            }
          }
        }

        // Atualiza os campos no Firestore
        await db.collection('users').doc(id).update(fieldsToUpdateInFirestore);

        return res.status(200).json({ message: 'Utilizador atualizado com sucesso.' });
      } catch (error) {
        console.error("Erro ao atualizar utilizador:", error);
        // Retorna a mensagem de erro específica do Firebase se disponível
        if (error.code) {
             return res.status(500).json({ error: `Erro do Firebase: ${error.message}` });
        }
        return res.status(500).json({ error: 'Erro interno ao atualizar utilizador.' });
      }

    case 'DELETE':
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
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
