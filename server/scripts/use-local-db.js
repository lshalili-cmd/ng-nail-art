// .env'deki DATABASE_URL'i YEREL SQLite'a çevirir; mevcut (Neon) ayarını yedekler.
// Başka hiçbir satıra dokunmaz. yerel-db-kur.bat tarafından çağrılır.
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const LOCAL = 'DATABASE_URL="file:./dev.db"';

let txt = '';
try { txt = fs.readFileSync(envPath, 'utf8'); } catch { txt = 'PORT=3000\n'; }

// Neon/mevcut .env'i bir kez yedekle (sonra geri dönmek istersen kullanılır)
const backup = envPath + '.neon-backup';
if (!fs.existsSync(backup)) {
  try { fs.writeFileSync(backup, txt); console.log('✓ Mevcut .env yedeklendi → server/.env.neon-backup'); }
  catch { /* geç */ }
}

// DATABASE_URL satırını (varsa) yerel SQLite ile değiştir; yoksa ekle. Diğer satırlar korunur.
if (/^\s*DATABASE_URL\s*=.*$/m.test(txt)) {
  txt = txt.replace(/^\s*DATABASE_URL\s*=.*$/m, LOCAL);
} else {
  txt = txt.replace(/\s*$/, '') + '\n' + LOCAL + '\n';
}

fs.writeFileSync(envPath, txt);
console.log('✓ .env → yerel SQLite (file:./dev.db). Neon ayarı .env.neon-backup içinde saklı.');
