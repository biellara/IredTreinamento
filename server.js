// server.js

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http'); // wrapper p/ serverless (ex.: Vercel/AWS)

const app = express();

// --- Middlewares Globais ---
app.use(cors());
app.use(express.json());

// --- Importação dos Handlers (CommonJS) ---
const loginHandler = require('./api/auth/login');
const simulationHandler = require('./api/tools/simulador');

// --- Rotas existentes ---
app.post('/api/auth/login', loginHandler);
app.post('/api/tools/simulador', simulationHandler);

// --- Rotas da API para Artigos (bridge p/ módulo ESM ./api/articles.js) ---
// Observação: api/articles.js exporta "default" um handler (req, res) que roteia por método.
app.all('/api/articles', async (req, res, next) => {
  try {
    const { default: articlesHandler } = await import('./api/articles.js');
    return articlesHandler(req, res);
  } catch (err) {
    return next(err);
  }
});

// Suporta /api/articles/:id preenchendo req.query.id,
// pois seu handler atual lê "id" via query string.
app.all('/api/articles/:id', async (req, res, next) => {
  try {
    const { default: articlesHandler } = await import('./api/articles.js');
    req.query = { ...req.query, id: req.params.id };
    return articlesHandler(req, res);
  } catch (err) {
    return next(err);
  }
});

// --- Procedimentos (também ESM com export default) ---
app.post('/api/procedimentos', async (req, res, next) => {
  try {
    const { default: procedimentosHandler } = await import('./api/procedimentos.js');
    return procedimentosHandler(req, res);
  } catch (err) {
    return next(err);
  }
});

// --- Tratamento de erro básico ---
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// --- Modo local (node server.js) ---
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

// --- Export para ambiente serverless (ex.: Vercel/AWS) ---
module.exports = serverless(app);
