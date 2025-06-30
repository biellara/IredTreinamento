const db = require('../firebase');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token JWT não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        // Apenas verifica o token, mas não usa o ID para filtrar as simulações
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.error('Erro ao verificar JWT:', err);
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const { scenario, start, end } = req.query;

    try {
        // ATUALIZADO: A query agora busca em todas as simulações, não apenas nas do usuário logado.
        let query = db.collection('simulations');

        // Os filtros de cenário e data continuam a ser aplicados se existirem
        if (scenario) {
            query = query.where('scenario', '==', scenario);
        }
        if (start) {
            query = query.where('createdAt', '>=', start);
        }
        if (end) {
            query = query.where('createdAt', '<=', end);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            return res.status(200).json({ simulations: [] });
        }

        const simulationsPromises = snapshot.docs.map(async (doc) => {
            const simulationData = doc.data();
            const simulationId = doc.id;
            let userData = {};

            if (simulationData.userId) {
                try {
                    const userDoc = await db.collection('users').doc(simulationData.userId).get();
                    if (userDoc.exists) {
                        userData = { username: userDoc.data().username };
                    }
                } catch (userError) {
                    console.error(`Erro ao buscar usuário ${simulationData.userId}:`, userError);
                }
            }

            return {
                id: simulationId,
                ...simulationData,
                ...userData,
            };
        });

        const simulations = await Promise.all(simulationsPromises);

        return res.status(200).json({ simulations });

    } catch (err) {
        console.error('Erro ao buscar simulações filtradas:', err);
        return res.status(500).json({ error: 'Erro interno ao buscar simulações.' });
    }
};
