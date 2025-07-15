// server.js

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http'); // Pacote para compatibilidade com Vercel

const app = express();

// --- Middlewares Globais ---
// Aplicados a todas as rotas que vêm a seguir
app.use(cors());
app.use(express.json());

// --- Importação dos Handlers da API ---
const loginHandler = require('./api/auth/login');
const simulationHandler = require('./api/tools/simulador');
const { 
    createArticle, 
    getArticles, 
    updateArticle, 
    deleteArticle 
} = require('./handlers/articles'); // Verifique se o caminho './handlers/articles' está correto

// --- Definição das Rotas da API ---

// Rotas existentes
app.post('/api/auth/login', loginHandler);
app.post('/api/tools/simulador', simulationHandler);

// Rotas da API para Artigos
app.get('/api/articles', getArticles);      // Obter todos os artigos ou um específico por ID
app.post('/api/articles', createArticle);   // Criar um novo artigo
app.put('/api/articles', updateArticle);    // Atualizar um artigo existente
app.delete('/api/articles', deleteArticle); // Excluir um artigo

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = serverless(app);
