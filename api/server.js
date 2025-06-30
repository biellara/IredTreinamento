// server.js (Versão Corrigida)

const express = require('express');
const cors = require('cors');
const app = express();

// --- Middlewares ---
// É importante que eles venham antes das rotas.
app.use(cors()); // Permite requisições de outras origens (seu frontend)
app.use(express.json()); // Permite que o Express entenda o corpo JSON das requisições

// --- Importação das Rotas ---
// Rotas de Autenticação
const signup = require('./auth/signup');
const login = require('./auth/login');

// CORREÇÃO: Importa a nova rota para salvar a simulação
const saveSimulation = require('./tools/simulador');


// --- Definição das Rotas ---
// Rotas de Autenticação
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);

// CORREÇÃO: Adiciona a rota que estava faltando para o simulador
app.post('/api/tools/simulador', saveSimulation);


// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));