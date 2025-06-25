const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../firebase');

module.exports = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  const snapshot = await db.collection('users')
    .where('email', '==', email).get();

  if (snapshot.empty)
    return res.status(401).json({ error: 'Usuário ou não encontrado.' });

  const userDoc = snapshot.docs[0];
  const user = userDoc.data();
  const userId = userDoc.id;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(401).json({ error: 'Usuário ou senha incorreta.' });

  const token = jwt.sign({ id: userId, email: user.email, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.status(200).json({
    message: 'Login realizado com sucesso.',
    token
  });
};
