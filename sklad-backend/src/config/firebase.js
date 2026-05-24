import admin from "firebase-admin";
import env from "./env.js";

let bucket = null;

try {
  if (env.FIREBASE_SERVICE_ACCOUNT && env.FIREBASE_STORAGE_BUCKET) {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const serviceAccount = require("../../" + env.FIREBASE_SERVICE_ACCOUNT.replace("./", ""));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
    bucket = admin.storage().bucket();
  } else if (env.FIREBASE_STORAGE_BUCKET) {
    if (!admin.apps.length) {
      admin.initializeApp({ storageBucket: env.FIREBASE_STORAGE_BUCKET });
    }
    bucket = admin.storage().bucket();
  }
} catch (e) {
  console.warn("Firebase init skipped:", e.message);
}

export { bucket };
export default admin;
