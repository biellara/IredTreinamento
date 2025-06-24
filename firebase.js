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