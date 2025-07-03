// Ficheiro: /firebase.js

const admin = require('firebase-admin');

let db, auth;

// Função para inicializar o Firebase de forma segura
function initializeFirebase() {
  try {
    if (!process.env.FIREBASE_ADMIN_SDK) {
        throw new Error("A variável de ambiente FIREBASE_ADMIN_SDK não está definida.");
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
    
    if (!serviceAccount.project_id) {
        throw new Error("O 'project_id' não foi encontrado no JSON da conta de serviço (FIREBASE_ADMIN_SDK).");
    }

    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    console.log(`✅ Tentando inicializar Firebase para o projeto: ${serviceAccount.project_id}`);
    
    // Inicializa a aplicação
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id, 
    });

  } catch (error) {
    // Se o erro for que a app já existe, ignoramos, pois é o comportamento esperado.
    if (error.code !== 'app/duplicate-app') {
        console.error('****************************************************');
        console.error('❌ FALHA CRÍTICA AO INICIALIZAR O FIREBASE ADMIN SDK:');
        console.error(error.message);
        console.error('****************************************************');
    }
  }
}

// Garante que a inicialização ocorra apenas uma vez.
if (!admin.apps.length) {
  initializeFirebase();
}

// Obtém as instâncias dos serviços a partir da app padrão
// Esta abordagem é mais segura em ambientes serverless
const app = admin.app();
db = app.firestore();
auth = app.auth();

module.exports = { db, auth, admin };
