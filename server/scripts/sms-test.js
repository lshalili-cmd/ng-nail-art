// ngNailArt — Twilio SMS TEŞHİS aracı. Neden demo'ya düştüğünü NET söyler.
// Kullanım: sms-test.bat (çift tık, numara sorar)  ·  ya da:  node scripts/sms-test.js +90XXXXXXXXXX
require('dotenv').config();

function realKey(v) { return !!v && !/your-|-here$/i.test(v); }
function mask(v) { return v ? (v.slice(0, 6) + '...' + v.slice(-2)) : ''; }

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM;

console.log('\n=== Twilio SMS Teşhis ===\n');
console.log('  TWILIO_ACCOUNT_SID :', SID ? (realKey(SID) ? 'VAR ✓ (' + mask(SID) + ')' : 'GEÇERSİZ/placeholder ✗') : 'YOK ✗');
console.log('  TWILIO_AUTH_TOKEN  :', TOKEN ? (realKey(TOKEN) ? 'VAR ✓' : 'GEÇERSİZ/placeholder ✗') : 'YOK ✗');
console.log('  TWILIO_FROM        :', FROM ? (realKey(FROM) ? FROM : 'GEÇERSİZ/placeholder ✗') : 'YOK ✗');

const to = (process.argv[2] || '').trim();

if (!realKey(SID) || !realKey(TOKEN) || !realKey(FROM)) {
  console.error('\n❌ Anahtarlar eksik/geçersiz → uygulama bu yüzden DEMO moduna düşüyor.');
  console.error('   Kontrol: server\\.env (kök .env DEĞİL) içinde 3 satır da gerçek değerle dolu mu, kaydettin mi?\n');
  process.exit(1);
}

let Twilio;
try { Twilio = require('twilio'); }
catch {
  console.error('\n❌ "twilio" paketi kurulu değil → uygulama DEMO moduna düşer.');
  console.error('   Çözüm:  cd server   sonra   npm install twilio\n');
  process.exit(1);
}
console.log('  twilio paketi      : KURULU ✓');

if (!to) {
  console.log('\nAnahtarlar ve paket TAMAM. Gerçek test SMS göndermek için numara ver:');
  console.log('  node scripts/sms-test.js +90XXXXXXXXXX\n');
  process.exit(0);
}

const client = Twilio(SID, TOKEN);
console.log('\n→ Test SMS gönderiliyor:  ' + FROM + '  →  ' + to + '  ...\n');
client.messages.create({ from: FROM, to, body: 'ngNailArt test kodu: 123456' })
  .then((m) => {
    console.log('✓ BAŞARILI! Twilio kabul etti. SID: ' + m.sid + ' · durum: ' + m.status);
    console.log('  Telefonuna birazdan SMS gelmeli. (Uygulamada da artık gerçek SMS gider.)\n');
  })
  .catch((e) => {
    console.error('❌ TWILIO HATASI → kod ' + (e.code || '-') + ' : ' + e.message);
    if (e.code === 21608) console.error('   ⮕ Numara DOĞRULANMAMIŞ. Console → Verified Caller IDs → bu numarayı ekle & doğrula.');
    else if (e.code === 21408) console.error('   ⮕ Coğrafi izin kapalı. Console → Messaging → Geographic Permissions → Türkiye’yi (SMS) aç.');
    else if (e.code === 21211) console.error('   ⮕ Numara formatı geçersiz. +90 ile, boşluksuz gir (ör. +905XXXXXXXXX).');
    else if (e.code === 20003) console.error('   ⮕ Kimlik doğrulama hatası. Account SID / Auth Token yanlış.');
    else if (e.code === 21606 || e.code === 21659) console.error('   ⮕ TWILIO_FROM numarası bu hesaba ait/SMS yetkili değil.');
    console.error('   (Bu hata, uygulamada neden demo’ya düştüğünün de sebebidir.)\n');
  });
