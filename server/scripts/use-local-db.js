// .env'deki DATABASE_URL'i YEREL SQLite'a çevirir; Neon ayarını bir kez yedekler.
// Kurşun geçirmez: mevcut TÜM DATABASE_URL satırlarını kaldırıp yerine file: koyar
// (çift satır / eski Neon URL kalması sorununu engeller). Diğer anahtarlar korunur.
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const LOCAL = 'DATABASE_URL="file:./dev.db"';

let txt = '';
try { txt = fs.readFileSync(envPath, 'utf8'); } catch { txt = 'PORT=3000\n'; }

// Neon/mevcut .env'i bir kez yedekle (geri dönmek istersen .env.neon-backup)
const backup = envPath + '.neon-backup';
if (!fs.existsSync(backup)) {
  try { fs.writeFileSync(backup, txt); console.log('OK: mevcut .env yedeklendi -> server/.env.neon-backup'); }
  catch { /* gec */ }
}

// TÜM DATABASE_URL satırlarını (yorumlu olmayan) çıkar, sonra file: satırını en başa koy.
const kept = txt.split(/\r?\n/).filter((line) => !/^\s*DATABASE_URL\s*=/.test(line));
// Baştaki/sondaki boş satırları toparla
while (kept.length && kept[0].trim() === '') kept.shift();
const out = LOCAL + '\n' + kept.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '') + '\n';

fs.writeFileSync(envPath, out);
console.log('OK: .env -> yerel SQLite (file:./dev.db). Neon ayari .env.neon-backup icinde saklandi.');
