const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const snapshot = await db.collection('content').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(data);
  } catch (err) {
    console.error('🔥 Firestore error:', err);
    return res.status(500).json({ error: err.message });
  }
};