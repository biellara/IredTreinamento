// Local: netlify/functions/getContent.js
const admin = require('firebase-admin');

// Inicializa a app do Firebase Admin UMA VEZ
try {
  if (!admin.apps.length) {
    // Obtém as credenciais a partir da variável de ambiente
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Erro ao inicializar o Firebase Admin:', error);
}

const db = admin.firestore();

exports.handler = async function (event, context) {
  // Apenas permite requisições GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // Busca todos os documentos da coleção 'content'
    const contentRef = db.collection('content');
    const snapshot = await contentRef.get();

    if (snapshot.empty) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Nenhum documento encontrado.' })
      };
    }

    // Mapeia os documentos para um array de objetos
    const allContent = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Retorna os dados como JSON
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allContent)
    };

  } catch (error) {
    console.error("Erro ao buscar dados do Firestore:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falha ao buscar dados do banco de dados.' })
    };
  }
};