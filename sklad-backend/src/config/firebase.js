import admin from "firebase-admin";
import env from "./env.js";

let bucket = null;

try {
  if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    const serviceAccount = JSON.parse(json);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
      });
    }
    bucket = admin.storage().bucket();
  }
} catch (e) {
  console.warn("Firebase init error:", e.message);
}

export { bucket };
export default admin;
