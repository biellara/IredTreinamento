const { db, auth } = require('../firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authenticateAndAuthorize = async (req, res, requiredRole) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'Acesso não autorizado. Token não fornecido.', status: 401 };
    }

    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        console.log('[AUTH] Token decodificado:', decodedToken);

        const userDoc = await db.collection('users').doc(decodedToken.id).get();

        if (!userDoc.exists) {
            console.warn('[AUTH] Utilizador não encontrado no Firestore para ID:', decodedToken.id);
            return { error: 'Utilizador não encontrado.', status: 404 };
        }

        const userData = userDoc.data();
        if (requiredRole && userData.role !== requiredRole) {
            return { error: `Acesso negado. Permissões de ${requiredRole} necessárias.`, status: 403 };
        }

        return { user: { id: decodedToken.id, ...userData }, status: 200 };

    } catch (error) {
        console.error('[AUTH] Erro na verificação do token:', error.message);
        return { error: 'Token inválido ou expirado.', status: 401 };
    }
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(204).end();

    if (req.method === 'GET' && req.url === '/api/user/info') {
        const authResult = await authenticateAndAuthorize(req, res);
        if (authResult.error) return res.status(authResult.status).json({ error: authResult.error });

        const { id, username, email, role } = authResult.user;
        return res.status(200).json({ id, username, email, role });
    }

    if (req.method === 'GET' && req.url === '/api/users') {
        const authResult = await authenticateAndAuthorize(req, res, 'admin');
        if (authResult.error) return res.status(authResult.status).json({ error: authResult.error });

        try {
            const usersSnapshot = await db.collection('users').get();
            const users = usersSnapshot.docs.map(doc => {
                const { password, ...userData } = doc.data();
                return { id: doc.id, ...userData };
            });
            return res.status(200).json(users);
        } catch (error) {
            console.error("[API] Erro ao listar utilizadores:", error);
            return res.status(500).json({ error: 'Erro interno ao buscar utilizadores.' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { username, email, password, role } = req.body;
            if (!username || !email || !password || !role) {
                return res.status(400).json({ error: 'Campos obrigatórios em falta: username, email, password, role.' });
            }

            const userRecord = await auth.createUser({
                email,
                password,
                displayName: username,
            });

            console.log('[API] Usuário criado no Auth com UID:', userRecord.uid);

            const hashedPassword = await bcrypt.hash(password, 10);
            const userData = {
                username,
                email,
                role,
                password: hashedPassword,
                createdAt: new Date().toISOString(),
                senhaTemporaria: true
            };

            await db.collection('users').doc(userRecord.uid).set(userData);
            console.log('[API] Usuário salvo no Firestore:', userData);

            return res.status(201).json({ id: userRecord.uid, message: 'Utilizador criado com sucesso.' });
        } catch (error) {
            console.error("[API] Erro ao criar utilizador:", error);
            if (error.code === 'auth/email-already-exists') {
                return res.status(409).json({ error: 'O e-mail fornecido já está em uso.' });
            }
            return res.status(500).json({ error: 'Erro interno ao criar utilizador.' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { id } = req.query;
            const { username, role, password } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'O ID do utilizador é obrigatório.' });
            }

            const updatesFirestore = {};
            const updatesAuth = {};

            if (username) {
                updatesFirestore.username = username;
                updatesAuth.displayName = username;
            }
            if (role) updatesFirestore.role = role;
            if (password) {
                updatesFirestore.password = await bcrypt.hash(password, 10);
                updatesAuth.password = password;
            }

            if (Object.keys(updatesAuth).length) {
                await auth.updateUser(id, updatesAuth);
                console.log('[API] Atualizado no Firebase Auth:', updatesAuth);
            }

            if (Object.keys(updatesFirestore).length) {
                await db.collection('users').doc(id).update(updatesFirestore);
                console.log('[API] Atualizado no Firestore:', updatesFirestore);
            }

            return res.status(200).json({ message: 'Utilizador atualizado com sucesso.' });
        } catch (error) {
            console.error("[API] Erro ao atualizar utilizador:", error);
            return res.status(500).json({ error: error.message || 'Erro interno ao atualizar utilizador.' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'O ID do utilizador é obrigatório.' });

            await auth.deleteUser(id);
            await db.collection('users').doc(id).delete();

            console.log('[API] Utilizador excluído com ID:', id);
            return res.status(200).json({ message: 'Utilizador excluído com sucesso.' });
        } catch (error) {
            console.error("[API] Erro ao excluir utilizador:", error);
            return res.status(500).json({ error: 'Erro interno ao excluir utilizador.' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};
