// login.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../firebase');

module.exports = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const snapshot = await db.collection('users')
      .where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Usuário ou senha incorreta.' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuário ou senha incorreta.' });
    }

    const tokenPayload = {
      id: userId,
      email: user.email,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.status(200).json({
      message: 'Login realizado com sucesso.',
      token,
      senhaTemporaria: user.senhaTemporaria || false,
      userId: userId
    });

  } catch (error) {
    console.error("Erro no processo de login:", error);
    return res.status(500).json({ error: "Ocorreu um erro interno." });
  }
};
