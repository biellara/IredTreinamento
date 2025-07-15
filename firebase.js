// Ficheiro: /firebase.js
import admin from 'firebase-admin';

// Verifica se a aplicação já foi inicializada
if (!admin.apps.length) {
  try {
    console.log("Inicializando o Firebase Admin SDK...");

    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);

    // Corrige quebra de linha no private_key
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("✅ Firebase Admin SDK inicializado com sucesso.");
  } catch (error) {
    console.error("❌ FALHA CRÍTICA AO INICIALIZAR O FIREBASE ADMIN SDK:", error);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
