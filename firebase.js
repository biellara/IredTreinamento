// Ficheiro: /firebase.js

const admin = require('firebase-admin');

// Verifica se a aplicação já foi inicializada para evitar duplicação.
// Este é o padrão recomendado для ambientes serverless (como a Vercel).
if (!admin.apps.length) {
  try {
    console.log("Inicializando o Firebase Admin SDK...");
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);

    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log("✅ Firebase Admin SDK inicializado com sucesso.");
  } catch (error) {
    console.error('❌ FALHA CRÍTICA AO INICIALIZAR O FIREBASE ADMIN SDK:', error);
  }
}

// Exporta as instâncias dos serviços a partir da app padrão já inicializada.
const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };
