import admin from '../config/firebase.js';

export const sendPush = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens || tokens.length === 0) return;
    const message = {
      notification: { title, body },
      data,
      tokens: Array.isArray(tokens) ? tokens : [tokens],
    };
    const res = await admin.messaging().sendEachForMulticast(message);
    console.log('Push yuborildi:', res.successCount, 'ta');
  } catch (err) {
    console.error('Push xatosi:', err.message);
  }
};
