const API_BASE = '/api/auth';

let tempToken = null;
let tempUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const passwordChangeForm = document.getElementById('passwordChangeForm');
  const passwordChangeModal = document.getElementById('passwordChangeModal');
  const passwordChangeError = document.getElementById('passwordChangeError');
  const errorMsg = document.getElementById('error-msg');

  // Função para decodificar o JWT
  function decodeJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMsg.textContent = '';

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.senhaTemporaria) {
          // Salva o token e ID temporariamente
          tempToken = data.token;
          tempUserId = data.userId;

          // Mostra o modal de troca de senha
          passwordChangeModal.classList.add('active');
        } else {
          localStorage.setItem('token', data.token);

          const decoded = decodeJwt(data.token);
          if (decoded && decoded.role) {
            localStorage.setItem('role', decoded.role);
          }

          alert('Login realizado com sucesso!');
          window.location.href = 'index.html';
        }
      } else {
        errorMsg.textContent = data.error || 'Erro ao fazer login';
      }
    });
  }

  if (passwordChangeForm) {
    passwordChangeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      passwordChangeError.textContent = '';

      const novaSenha = document.getElementById('newPassword').value;
      const confirmarSenha = document.getElementById('confirmPassword').value;

      if (novaSenha.length < 6) {
        passwordChangeError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        return;
      }
      if (novaSenha !== confirmarSenha) {
        passwordChangeError.textContent = 'As senhas não coincidem.';
        return;
      }

      try {
        const res = await fetch('/api/update-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tempToken}`
          },
          body: JSON.stringify({
            userId: tempUserId,
            novaSenha
          })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Erro ao atualizar senha.');

        alert('Senha atualizada com sucesso!');

        // Salva token e role no localStorage
        localStorage.setItem('token', tempToken);

        const decoded = decodeJwt(tempToken);
        if (decoded && decoded.role) {
          localStorage.setItem('role', decoded.role);
        }

        window.location.href = 'index.html';
      } catch (err) {
        passwordChangeError.textContent = err.message;
      }
    });
  }
});

// Verifica se o usuário está autenticado
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// Protege páginas privadas
function protectPage() {
  if (!isAuthenticated()) {
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'login.html';
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
}
