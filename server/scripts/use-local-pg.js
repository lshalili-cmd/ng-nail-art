// .env'deki DATABASE_URL'i YEREL PostgreSQL'e çevirir; Neon ayarını bir kez yedekler.
// Kullanım: node scripts/use-local-pg.js "<DATABASE_URL>"
// Kurşun geçirmez: mevcut TÜM DATABASE_URL satırlarını kaldırıp yerine yerel URL'i koyar.
// Diğer anahtarlar (JWT_SECRET, FAL_KEY vb.) korunur.
const fs = require('fs');
const path = require('path');

const url = process.argv[2];
if (!url || !/^postgres/i.test(url)) {
  console.error('HATA: Gecerli bir postgresql:// adresi verilmedi.');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env');
let txt = '';
try { txt = fs.readFileSync(envPath, 'utf8'); } catch { txt = 'PORT=3000\n'; }

// Mevcut .env'i (Neon dahil) bir kez yedekle — sqlite yedeğini EZME.
const backup = envPath + '.neon-backup';
if (!fs.existsSync(backup) && /neon\.tech|@ep-/.test(txt)) {
  try { fs.writeFileSync(backup, txt); console.log('OK: mevcut .env yedeklendi -> server/.env.neon-backup'); }
  catch { /* gec */ }
}

const LOCAL = `DATABASE_URL="${url}"`;
const kept = txt.split(/\r?\n/).filter((line) => !/^\s*DATABASE_URL\s*=/.test(line));
while (kept.length && kept[0].trim() === '') kept.shift();
const out = LOCAL + '\n' + kept.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '') + '\n';

fs.writeFileSync(envPath, out);
console.log('OK: .env -> yerel PostgreSQL. (Geri donmek icin: .env.neon-backup)');
