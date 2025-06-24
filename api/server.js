const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const signup = require('./api/auth/signup');
const login = require('./api/auth/login');

app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
