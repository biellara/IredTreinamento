const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function getQuizFromFirestore(id) {
  const snapshot = await db.collection('quizzes').where('id', '==', id).get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

async function getAllQuizzesFromFirestore() {
  const snapshot = await db.collection('quizzes').get();
  return snapshot.docs.map(doc => doc.data());
}

module.exports = {
  getQuizFromFirestore,
  getAllQuizzesFromFirestore,
};
