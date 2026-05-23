const sharp = require('sharp');
const sizes = [16,32,48,180,192,256,512,1024];
const out = 'icons';
require('fs').mkdirSync(out, {recursive:true});
(async()=>{
  for(const s of sizes){
    await sharp('Logo1.1.png').resize(s,s,{fit:'contain',background:{r:255,g:255,b:255,alpha:1}}).png().toFile(`${out}/icon-${s}.png`);
    console.log('OK:',s);
  }
  console.log('Tayyor!');
})();
