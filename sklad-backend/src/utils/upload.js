import { bucket } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadImage = async (file, folder = 'products') => {
  const filename = folder + '/' + uuidv4() + '_' + file.originalname;
  const fileRef = bucket.file(filename);

  await fileRef.save(file.buffer, {
    metadata: { contentType: file.mimetype },
    public: true,
  });

  const publicUrl = 'https://storage.googleapis.com/' + bucket.name + '/' + filename;
  return publicUrl;
};

export const deleteImage = async (url) => {
  try {
    const filename = url.split(bucket.name + '/')[1];
    await bucket.file(filename).delete();
  } catch (err) {
    console.error('Rasm ochirish xatosi:', err.message);
  }
};
