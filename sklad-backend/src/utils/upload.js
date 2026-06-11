import { bucket } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve('uploads');

export const uploadImage = async (file, folder = 'products', baseUrl = '') => {
  const safeName = (file.originalname || 'image').replace(/[^\w.-]/g, '_');
  const filename = folder + '/' + uuidv4() + '_' + safeName;

  // Если Firebase настроен — грузим в облако
  if (bucket) {
    const fileRef = bucket.file(filename);
    await fileRef.save(file.buffer, { metadata: { contentType: file.mimetype }, public: true });
    return 'https://storage.googleapis.com/' + bucket.name + '/' + filename;
  }

  // Фолбэк: локальное хранилище (Firebase не настроен)
  const dir = path.join(UPLOAD_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return (baseUrl || '') + '/uploads/' + filename;
};

export const deleteImage = async (url) => {
  try {
    if (bucket && url.includes(bucket.name)) {
      const filename = url.split(bucket.name + '/')[1];
      await bucket.file(filename).delete();
      return;
    }
    // Локальный файл
    const marker = '/uploads/';
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const rel = url.slice(idx + marker.length);
      const fp = path.join(UPLOAD_DIR, rel);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  } catch (err) {
    console.error('Ошибка удаления изображения:', err.message);
  }
};
