const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../firebase'); // seu firebase.js configurado

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    // Verificar se o usuário já existe
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await usersRef.add(newUser);

    const token = jwt.sign({ email, username }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return res.status(200).json({ message: 'Usuário cadastrado com sucesso.', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};
