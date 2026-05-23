const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO = 'logo.png';
const OUT = 'icons';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const tasks = [
  // Favicon (web)
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  // PWA / Web manifest
  { name: 'web-192.png', size: 192 },
  { name: 'web-512.png', size: 512 },
  // Apple touch
  { name: 'apple-touch-180.png', size: 180 },
  // Android (Expo)
  { name: 'android-icon.png', size: 1024 },
  { name: 'android-adaptive.png', size: 1024 },
  { name: 'android-splash.png', size: 1242 },
  // Electron (desktop)
  { name: 'desktop-256.png', size: 256 },
  { name: 'desktop-512.png', size: 512 },
  { name: 'desktop-1024.png', size: 1024 },
];

(async () => {
  for (const t of tasks) {
    await sharp(LOGO).resize(t.size, t.size, { fit: 'contain', background: { r:255, g:255, b:255, alpha:1 } }).png().toFile(path.join(OUT, t.name));
    console.log('OK:', t.name);
  }
  console.log('Tayyor!');
})();
