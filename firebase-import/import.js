const admin = require('firebase-admin');
const fs = require('fs');

// Carrega a chave de serviço
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Lê o arquivo JSON
const data = JSON.parse(fs.readFileSync('./database.json', 'utf8'));

// Sobe os quizzes
async function importData() {
  const quizzes = data.quizzes;

  for (const quiz of quizzes) {
    const docRef = db.collection('quizzes').doc(quiz.id);
    await docRef.set(quiz);
    console.log(`✔ Quiz '${quiz.id}' importado com sucesso.`);
  }

  console.log('🎉 Importação concluída.');
}

importData().catch(console.error);
