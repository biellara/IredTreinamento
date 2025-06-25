const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// 1. Importe o 'admin' (a caixa de ferramentas) do seu arquivo de configuração
const admin = require('../../firebase');

// 2. CORREÇÃO: Pegue a ferramenta 'firestore' de dentro da caixa 'admin'
const db = admin.firestore();

module.exports = async (req, res) => {
  try { // É uma boa prática envolver a lógica em um bloco try...catch
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    // O resto do seu código agora funcionará, pois 'db' é o Firestore.
    // Verifica se o email já existe
    const emailSnapshot = await db.collection('users')
      .where('email', '==', email).get();

    if (!emailSnapshot.empty) {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }

    // Verifica se o username já existe
    const usernameSnapshot = await db.collection('users')
      .where('username', '==', username).get();

    if (!usernameSnapshot.empty) {
      return res.status(409).json({ error: 'Nome de usuário já em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserRef = await db.collection('users').add({
      username,
      email,
      password: hashedPassword, // ATENÇÃO: Risco de segurança ao guardar senhas no Firestore
      createdAt: new Date().toISOString()
    });

    // Certifique-se que JWT_SECRET e JWT_EXPIRES_IN estão no seu ambiente
    const token = jwt.sign({ id: newUserRef.id, email, username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      token
    });
  } catch(error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
  }
};