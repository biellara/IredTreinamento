const admin = require('firebase-admin');

console.log('🔍 INIT: FIREBASE_ADMIN_SDK:', process.env.FIREBASE_ADMIN_SDK?.slice(0, 50), '...');

try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
    console.log('✅ Parsed serviceAccount ok');
    admin.initializeApp({
      credential: admin.credential.cert(process.env.FIREBASE_ADMIN_SDK)
    });
    console.log('✅ Firebase Admin initialized');
  }
} catch (error) {
  console.error('❌ Initialization error:', error);
  throw error; // força função a falhar com erro explícito
}

const db = admin.firestore();

exports.handler = async function (event, context) {
  console.log('🔁 Handler invoked, httpMethod =', event.httpMethod);

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const snapshot = await db.collection('content').get();
    console.log('📄 Retrieved', snapshot.size, 'documents');

    const allContent = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allContent)
    };

  } catch (error) {
    console.error('❌ Firestore read error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
