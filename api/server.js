// server.js (Versão Reestruturada para Testes)

// A biblioteca 'dotenv' não é mais necessária para as credenciais do Firebase
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Seus módulos de autenticação continuam funcionando normalmente
// pois eles importam a instância já configurada de 'firebase.js'
const signup = require('./auth/signup');
const login = require('./auth/login');

app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);

// A variável PORT ainda pode vir do .env se você quiser, ou pode fixar um valor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));