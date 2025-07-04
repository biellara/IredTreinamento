// server.js

const express = require('express');
const cors = require('cors');

const app = express();

// --- Middlewares globais ---
app.use(cors());
app.use(express.json());

// --- Importa rotas ---
const login = require('./api/auth/login');
const saveSimulation = require('./api/tools/simulador');

app.post('/api/auth/login', login);
app.post('/api/tools/simulador', saveSimulation);

// ✅ Exporta como handler para Vercel
module.exports = app;
module.exports.handler = serverless(app);

// ✅ Se rodar local: inicia normalmente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
