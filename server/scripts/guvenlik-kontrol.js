// ngNailArt — TEST ONCESI GUVENLIK ON-KONTROLU (ZORUNLU KAPI).
// Amac: testlerin YANLISLIKLA canli Neon/Render/production'a baglanmamasini garantilemek.
// Bu betik GECMEDEN hicbir test calistirilmaz. Uretim tespit edilirse cikis kodu 1 (durdur).
require('dotenv').config();
const fs = require('fs');
const path = require('path');

let fail = false;
const line = () => console.log('------------------------------------------------------------');
const ok = (m) => console.log('  [GECTI] ' + m);
const bad = (m) => { console.log('  [DURDUR] ' + m); fail = true; };
const warn = (m) => console.log('  [UYARI] ' + m);

console.log('============================================================');
console.log('  GUVENLIK ON-KONTROLU (local test guvenligi)');
console.log('============================================================');

// 1) DATABASE_URL local mi?
line();
const url = process.env.DATABASE_URL || '';
const masked = url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@');
console.log('1) DATABASE_URL:', masked || '(bos)');
const prodSigns = /neon\.tech|@ep-|render\.com|amazonaws|supabase|\.database\.azure|\.rds\./i;
const localSigns = /@(localhost|127\.0\.0\.1|::1|host\.docker\.internal)[:/]/i;
if (!url) bad('DATABASE_URL bos — test ortami belirsiz.');
else if (prodSigns.test(url)) bad('URUN/CANLI veritabani tespit edildi (Neon/Render/bulut). TEST DURDURULDU.');
else if (localSigns.test(url) || /^file:/.test(url)) ok('Yerel veritabani (localhost / 127.0.0.1 / docker / sqlite).');
else warn('Host yerel gorunmuyor; emin degilsen testleri baslatma. URL: ' + masked);

// 2) Uretim baglantisi aktif mi? (ek koruma)
line();
console.log('2) Uretim baglanti kontrolu');
if (prodSigns.test(url)) bad('Uretim baglantisi aktif — durduruldu.');
else ok('Uretim baglantisi yok.');

// 3) Ortam degiskenleri
line();
console.log('3) Ortam degiskenleri');
console.log('   NODE_ENV     :', process.env.NODE_ENV || '(tanimsiz)');
console.log('   PORT         :', process.env.PORT || '3000 (varsayilan)');
console.log('   APP_URL      :', process.env.APP_URL || '(tanimsiz)');
console.log('   FRONTEND_URL :', process.env.FRONTEND_URL || '(tanimsiz)');
if (process.env.NODE_ENV === 'production') warn('NODE_ENV=production — yerel testte genelde development olmali.');
else ok('NODE_ENV uretim degil.');

// 4) Odeme/AI anahtarlari test/sandbox mi?
line();
console.log('4) Odeme & AI anahtarlari');
const iyziUri = process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com';
if (/sandbox/i.test(iyziUri)) ok('iyzico SANDBOX (' + iyziUri + ').');
else bad('iyzico CANLI uri (' + iyziUri + ') — testte sandbox olmali! IYZICO_URI=https://sandbox-api.iyzipay.com yap.');
if (process.env.STRIPE_SECRET_KEY && !/_test_/.test(process.env.STRIPE_SECRET_KEY)) bad('Stripe CANLI anahtar (sk_live) — testte sk_test olmali.');
else ok('Stripe canli anahtar yok / test.');
if (process.env.FAL_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) warn('AI anahtari tanimli — AI uretim testleri GERCEK API cagirir (ucret olusabilir). Sandbox yoktur; az sayida cagir.');
else ok('AI anahtari yok — AI uretim demo/atlanir.');

// 5) DB yeniden kurulabilir mi?
line();
console.log('5) Veritabani yeniden kurulabilirlik');
const schema = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schema)) ok('schema.prisma var — DB "prisma db push" ile bastan kurulabilir (yerel test verisi kayipsiz geri gelir).');
else bad('schema.prisma bulunamadi.');

// 6) .env gizli mi + loglara sir yazimi var mi?
line();
console.log('6) Sir sizintisi kontrolu');
const gi = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gi) && /(^|\n)\s*\.env/.test(fs.readFileSync(gi, 'utf8'))) ok('.env .gitignore icinde (commit edilmez).');
else warn('.env .gitignore icinde gorunmuyor — kontrol et.');
// server/*.js icinde riskli console.log taramasi
const risky = /(console\.(log|info|warn|error)\([^)]*\b(passwordHash|password|otpCode|resetToken|JWT_SECRET|SECRET|DATABASE_URL|FAL_KEY|IYZICO_SECRET|STRIPE_SECRET)\b)/;
let hits = 0;
for (const f of fs.readdirSync(path.join(__dirname, '..')).filter((x) => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  src.split(/\r?\n/).forEach((ln, i) => { if (risky.test(ln)) { hits++; console.log(`   ! ${f}:${i + 1} loglama sir icerebilir`); } });
}
if (hits === 0) ok('Kaynak kodda sir loglayan console cagrisi bulunamadi.');
else warn(hits + ' satirda sir loglama riski — incele.');

console.log('============================================================');
if (fail) {
  console.log('  SONUC: DURDURULDU. Yukaridaki [DURDUR] maddelerini duzeltmeden test YAPMA.');
  process.exit(1);
}
console.log('  SONUC: GUVENLI. Yerel test ortami dogrulandi, testlere baslanabilir.');
console.log('============================================================');
