const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../firebase'); // Assumindo que este arquivo exporta o firestore db

module.exports = async (req, res) => {
  // Configura os headers de CORS para permitir requisições de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responde com sucesso a requisições de preflight (método OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // 204 No Content é mais comum para OPTIONS
  }
  
  // Garante que apenas o método POST seja aceito
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Bloco de segurança para tratar o corpo da requisição
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Corpo da requisição (JSON) inválido.' });
  }

  const { username, email, password } = body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const usersRef = db.collection('users');
    
    // Verifica a existência do e-mail
    const emailSnapshot = await usersRef.where('email', '==', email).get();
    if (!emailSnapshot.empty) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    // Verifica a existência do nome de usuário (opcional, mas boa prática)
    const userSnapshot = await usersRef.where('username', '==', username).get();
    if (!userSnapshot.empty) {
        return res.status(409).json({ error: 'Este nome de usuário já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    // --- AJUSTE IMPORTANTE AQUI ---
    // 1. Capture a referência do documento ao adicionar para obter o ID
    const docRef = await usersRef.add(newUser);

    // 2. Inclua o ID do novo usuário no token. É o melhor identificador.
    const token = jwt.sign(
        { id: docRef.id, email: newUser.email, username: newUser.username }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // SUGESTÃO: Use o status 201 (Created) para respostas de POST bem-sucedidas
    // que resultam na criação de um novo recurso.
    return res.status(201).json({ message: 'Usuário cadastrado com sucesso.', token });

  } catch (err) {
    console.error("Erro interno no cadastro:", err);
    return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
};
