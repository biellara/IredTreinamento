const jwt = require('jsonwebtoken');

module.exports = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token não fornecido', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { decoded };
  } catch (err) {
    return { error: 'Token inválido', status: 403 };
  }
};
