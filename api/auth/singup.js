const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../firebase');

module.exports = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

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
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });

  const token = jwt.sign({ id: newUserRef.id, email, username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.status(201).json({
    message: 'Usuário cadastrado com sucesso.',
    token
  });
};
