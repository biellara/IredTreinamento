const admin = require("firebase-admin");

// Carrega o arquivo de credenciais diretamente da pasta da função
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

exports.handler = async function (event, context) {
  console.log("🔁 Handler invoked, httpMethod =", event.httpMethod);

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const snapshot = await db.collection("content").get();
    console.log("📄 Retrieved", snapshot.size, "documents");

    const allContent = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allContent)
    };
  } catch (error) {
    console.error("❌ Firestore read error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
