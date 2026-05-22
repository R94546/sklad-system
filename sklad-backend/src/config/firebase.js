import admin from 'firebase-admin';
import { createRequire } from 'module';
import env from './env.js';

const require = createRequire(import.meta.url);
const serviceAccount = require('../../' + env.FIREBASE_SERVICE_ACCOUNT.replace('./', ''));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
});

export const bucket = admin.storage().bucket();
export default admin;
