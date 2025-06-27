
const API_BASE = '/api/auth';


document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        alert('Cadastro realizado com sucesso!');
        window.location.href = 'index.html';
      } else {
        alert(data.error || 'Erro ao cadastrar');
      }
    });// Ver o que está sendo enviado

  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        alert('Login realizado com sucesso!');
        window.location.href = 'index.html';
      } else {
        alert(data.error || 'Erro ao fazer login');
      }
    });
  }
});

// src/js/auth.js

// Verifica se o usuário está autenticado
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

// Redireciona se não estiver autenticado
function protectPage() {
  if (!isAuthenticated()) {
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
