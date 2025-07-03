// O seu ficheiro de login, agora atualizado para incluir a 'role' no token.

const bcrypt = require('bcryptjs'); // Recomendo usar bcryptjs para evitar problemas de compilação
const jwt = require('jsonwebtoken');
const { db } = require('../../firebase'); // Assumindo que o seu ficheiro firebase.js está dois níveis acima

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

    // --- LOG DE DEPURAÇÃO ADICIONADO ---
    // Vamos verificar se a JWT_SECRET está a ser carregada corretamente aqui.
    console.log('[API de Login] Gerando token com JWT_SECRET:', process.env.JWT_SECRET ? `...${process.env.JWT_SECRET.slice(-6)}` : 'NÃO DEFINIDA');

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.status(200).json({
      message: 'Login realizado com sucesso.',
      token
    });

  } catch (error) {
    console.error("Erro no processo de login:", error);
    return res.status(500).json({ error: "Ocorreu um erro interno." });
  }
};
