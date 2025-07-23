// firebase.js
import 'dotenv/config';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {

    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

  } catch (error) {
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
