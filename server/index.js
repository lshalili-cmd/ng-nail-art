// ngNailArt backend — Express + AI (port 3000)
// Angular dev proxy'si /api ve /images'i buraya yönlendirir (proxy.conf.json).
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ai = require('./ai');
const db = require('./db');
const payments = require('./payments');
const catalog = require('./catalog');
const auth = require('./auth');
const sms = require('./sms');
const mailer = require('./mailer');
const admin = require('./admin');
const rateLimit = (() => { try { return require('express-rate-limit'); } catch { return null; } })();

const IS_PROD = process.env.NODE_ENV === 'production';

ai.initProviders();
payments.initProviders();
if (!auth.ready()) console.warn('ℹ️  Auth paketleri yok (npm i bcryptjs jsonwebtoken) — giriş uçları 503, guest modu çalışır.');
if (!sms.ready()) console.warn('ℹ️  SMS sağlayıcısı yok — OTP DEMO modunda (kod yanıtta döner). Twilio/Netgsm anahtarı ekleyin.');
if (!mailer.ready()) console.warn('ℹ️  SMTP yok — şifre sıfırlama e-postası DEMO modunda (bağlantı yanıtta döner).');

// GÜVENLİK (fail-fast): Üretimde JWT_SECRET zayıfsa (yok/varsayılan/kısa) token'lar
// sahte üretilebilir → sunucuyu BAŞLATMA. Geliştirmede yalnızca uyar.
if (auth.weakSecret()) {
  if (IS_PROD) {
    console.error('❌ ÜRETİMDE JWT_SECRET tanımsız/varsayılan/çok kısa. En az 16 karakter rastgele bir değer verin. Başlatma DURDURULDU.');
    process.exit(1);
  } else {
    console.warn('⚠️  JWT_SECRET zayıf (varsayılan) — yalnızca geliştirmede kabul edilir. Üretimde güçlü bir değer verin.');
  }
}
if (!IS_PROD && !mailer.ready() && !sms.ready()) {
  console.warn('ℹ️  SMS ve e-posta DEMO — OTP/reset kodları API yanıtında döner (yalnızca geliştirme). Üretimde en az biri gerçek olmalı.');
}
if (IS_PROD && (!mailer.ready() || !sms.ready())) {
  console.warn('⚠️  ÜRETİMDE SMS veya e-posta DEMO modda! OTP/reset kodu yanıtta DÖNMEZ (demoOtp üretimde gizlenir) ama gerçek kod da gitmez. Twilio + Brevo anahtarlarını girin.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Render/Neon gibi ters-vekil arkasında gerçek istemci IP'si için (rate-limit doğru çalışsın).
app.set('trust proxy', 1);

// CORS — üretimde YALNIZCA izin verilen origin'lere. Liste APP_URL + ALLOWED_ORIGINS'ten
// kurulur; native (Capacitor) ve sunucu-sunucu istekleri (Origin'siz) her zaman geçer.
const ALLOWED = new Set(
  [process.env.APP_URL, process.env.FRONTEND_URL, ...String(process.env.ALLOWED_ORIGINS || '').split(',')]
    .map((s) => String(s || '').trim().replace(/\/+$/, '')).filter(Boolean)
);
// Native kabuk origin'leri her zaman izinli (mobil uygulama canlı backend'e bunlarla gelir).
['https://localhost', 'capacitor://localhost', 'ionic://localhost', 'http://localhost:4200', 'http://localhost:8100'].forEach((o) => ALLOWED.add(o));
// Delegate biçimi: AYNI-ORIGIN (uygulama backend ile aynı adresten sunulur) HER ZAMAN geçer —
// böylece APP_URL yanlış/eksik olsa bile üretimde login/ödeme kırılmaz. Çapraz origin yalnızca allowlist'te.
app.use(cors((req, cb) => {
  const origin = req.headers.origin;
  const host = req.headers.host || '';
  let ok = false;
  if (!origin) ok = true;                                  // native/mobil/curl (Origin yok)
  else {
    const clean = String(origin).replace(/\/+$/, '');
    const sameHost = clean === `https://${host}` || clean === `http://${host}`;
    ok = !IS_PROD || sameHost || ALLOWED.has(clean);
  }
  cb(ok ? null : new Error('CORS: origin izinli değil'), { origin: ok, credentials: true });
}));
app.use(express.json({ limit: '4mb' }));

// ── Rate limiting (kaba kuvvet / kötüye kullanım koruması) ─────────────────
// Paket yoksa (yerel, kurulmamış) no-op'a düşer; üretimde express-rate-limit kurulur.
function makeLimiter(opts) {
  if (!rateLimit) return (_req, _res, next) => next();
  return rateLimit({ standardHeaders: true, legacyHeaders: false, message: { success: false, error: 'Çok fazla istek, lütfen biraz sonra tekrar deneyin.', code: 'RATE_LIMITED' }, ...opts });
}
const authLimiter = makeLimiter({ windowMs: 15 * 60 * 1000, max: 40 });   // giriş/kayıt/otp/şifre
const aiLimiter = makeLimiter({ windowMs: 10 * 60 * 1000, max: 40 });     // AI üretim uçları
const writeLimiter = makeLimiter({ windowMs: 10 * 60 * 1000, max: 60 });  // halka açık yazma (designs/support)
if (!rateLimit) console.warn('ℹ️  express-rate-limit kurulu değil — hız sınırı KAPALI. Üretim için: npm i express-rate-limit');

// Yönetici: hata yakalama (loglanan tüm hatalar panele düşer) + bakım modu geçidi
admin.captureConsole();
app.use(admin.maintenanceGate);

// Üretilen görsellerin klasörü + statik sunum
const IMG_DIR = path.join(__dirname, 'images', 'ai-generated');
fs.mkdirSync(IMG_DIR, { recursive: true });
app.use('/images', express.static(path.join(__dirname, 'images'), {
  setHeaders: (res) => res.set('Cache-Control', 'no-cache'),
}));

// KATALOG GÖRSELLERİ: public/designs klasöründen sun. UZANTI-TOLERANSLI —
// istek design-1.jpg olsa bile dosya .png/.jpeg/.webp ise onu bulup sunar.
// (Kullanıcının görselleri PNG ama adları .jpg olabilir; bu yüzden esnek arıyoruz.)
const DESIGNS_DIR = path.join(__dirname, '..', 'public', 'designs');
app.get('/designs/:file', (req, res, next) => {
  const safe = path.basename(req.params.file || '');           // yol gezme koruması
  const base = safe.replace(/\.[^.]+$/, '');                    // "design-1.jpg" -> "design-1"
  const candidates = [safe, base + '.jpg', base + '.png', base + '.jpeg', base + '.webp',
    base + '.JPG', base + '.PNG', base + '.jpg.png', base + '.png.jpg'];
  for (const name of candidates) {
    const p = path.join(DESIGNS_DIR, name);
    if (name && fs.existsSync(p) && fs.statSync(p).isFile()) {
      res.set('Cache-Control', 'public, max-age=86400');
      return res.sendFile(p);
    }
  }
  return next(); // bulunamazsa normal akışa bırak
});

// ÜRETİM: derlenmiş Angular arayüzünü aynı sunucudan sun (tek servis deploy).
// dist yoksa (yerel geliştirme) atlanır; o zaman ön yüz ayrı `ng serve` ile çalışır.
const CLIENT_DIR = path.join(__dirname, '..', 'dist', 'ng-nail-art', 'browser');
const HAS_CLIENT = fs.existsSync(path.join(CLIENT_DIR, 'index.html'));
if (HAS_CLIENT) {
  app.use(express.static(CLIENT_DIR, {
    setHeaders: (res, p) => { if (p.endsWith('index.html')) res.set('Cache-Control', 'no-cache'); },
  }));
  console.log('🖥️  Angular arayüzü sunuluyor (üretim modu): ' + CLIENT_DIR);
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'healthy', time: new Date().toISOString() } });
});

app.get('/api/ai/status', (_req, res) => {
  res.json({ success: true, data: ai.status() });
});

// GÜVENLİK: giriş zorunlu uçlar için — token yoksa 401 döner, null verir.
function requireUserId(req, res) {
  const uid = auth.userIdFrom(req);
  if (uid === 'guest') { res.status(401).json({ success: false, error: 'Bu işlem için giriş yapın', code: 'AUTH_REQUIRED' }); return null; }
  return uid;
}

// AI metin üretimi — giriş + hız sınırı (ücretli LLM'in anonim/sınırsız kullanımı engellenir).
app.post('/api/ai/chat', aiLimiter, async (req, res) => {
  const uid = requireUserId(req, res); if (!uid) return;
  const { prompt, language } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Lütfen bir tasarım isteği girin', code: 'EMPTY_PROMPT' });
  }
  try {
    console.log(`🎨 AI chat (kullanıcı ${uid}): "${prompt.slice(0, 60)}..."`);
    const data = await ai.chat(prompt, language);
    res.json({ success: true, data, meta: { provider: ai.status().provider, model: ai.status().model, timestamp: new Date().toISOString() } });
  } catch (e) {
    handleAiError(res, e);
  }
});

// Görsel üretimi — giriş + SUNUCU TARAFI KOTA (istemci localStorage'ına güvenilmez) + hız sınırı.
// Kota sunucuda düşülür → kullanıcı endpoint'i doğrudan çağırarak paywall'ı DELEMEZ.
app.post('/api/ai/generate-image', aiLimiter, async (req, res) => {
  const uid = requireUserId(req, res); if (!uid) return;
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt gerekli', code: 'EMPTY_PROMPT' });
  }
  if (!db.ready()) return dbNotReady(res);
  try {
    const user = await db.prisma.user.findUnique({ where: { id: Number(uid) } });
    if (!user) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    const info = catalog.planInfo(user.plan, user.planSince, Date.now());
    // Dönem (aylık pencere) değiştiyse plan kullanımı sıfırdan sayılır.
    const usedInPeriod = user.imagesPeriod === info.period ? (user.imagesUsed || 0) : 0;
    const planLeft = Math.max(0, info.limit - usedInPeriod);
    const extra = Math.max(0, user.imagesExtra || 0);
    if (planLeft + extra <= 0) {
      return res.status(402).json({ success: false, error: 'Görsel üretim hakkınız doldu. Mağazadan ek paket alabilirsiniz.', code: 'QUOTA_EXCEEDED' });
    }
    console.log(`🖼️  Görsel üretimi (kullanıcı ${uid}, kalan ${planLeft + extra}): "${prompt.slice(0, 50)}..."`);
    const data = await ai.generateImage(req.body, IMG_DIR);
    // Başarı → hakkı SUNUCUDA düş: önce plan hakkı, o bitince ek paket bakiyesi.
    let nextUsed = usedInPeriod, nextExtra = extra;
    if (planLeft > 0) nextUsed = usedInPeriod + 1; else nextExtra = extra - 1;
    const upd = await db.prisma.user.update({
      where: { id: Number(uid) },
      data: { imagesUsed: nextUsed, imagesExtra: nextExtra, imagesPeriod: info.period },
    });
    console.log(`✅ Görsel kaydedildi: ${data.filename} (${Math.round(data.size / 1024)}KB, ${data.provider})`);
    res.json({
      success: true, data, user: auth.pub(upd),
      quota: { used: nextUsed, extra: nextExtra, limit: info.limit, remaining: Math.max(0, info.limit - nextUsed) + nextExtra },
    });
  } catch (e) {
    handleAiError(res, e);
  }
});

// ===== Veritabanı uçları (Prisma) =====
function dbNotReady(res) {
  return res.status(503).json({ success: false, error: 'Veritabanı kurulmadı. server klasöründe: npm run db:setup', code: 'DB_NOT_READY' });
}
function dbError(res, e) {
  console.error('❌ DB hatası:', e.message);
  res.status(500).json({ success: false, error: e.message, code: 'DB_ERROR' });
}

// --- Tasarımlar ---
app.get('/api/designs', async (_req, res) => {
  if (!db.ready()) return dbNotReady(res);
  try {
    const items = await db.prisma.design.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, designs: items.map(db.designOut), count: items.length });
  } catch (e) { dbError(res, e); }
});

app.post('/api/designs', writeLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const uid = requireUserId(req, res); if (!uid) return;   // anonim spam engeli (giriş şart)
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ success: false, error: 'name gerekli', code: 'BAD_REQUEST' });
  // Görsel boyut sınırı: dev DB'yi devasa base64 ile şişirmeyi engelle (~1.5MB).
  if (typeof b.img === 'string' && b.img.length > 1_600_000) {
    return res.status(413).json({ success: false, error: 'Görsel çok büyük', code: 'IMG_TOO_LARGE' });
  }
  try {
    const d = await db.prisma.design.create({
      data: {
        name: b.name, artist: b.artist || 'AI Studio', pattern: b.pattern || 'glossy', category: b.category || 'ai',
        colors: db.stringifyArr(b.colors), shapes: db.stringifyArr(b.shapes), tones: db.stringifyArr(b.tones),
        undertones: db.stringifyArr(b.undertones), seasons: db.stringifyArr(b.seasons && b.seasons.length ? b.seasons : ['all']),
        img: b.img || '', prompt: b.prompt || '', source: b.source || 'ai_studio',
      },
    });
    res.json({ success: true, design: db.designOut(d) });
  } catch (e) { dbError(res, e); }
});

// --- Kimlik doğrulama (JWT) ---
function authNotReady(res) {
  return res.status(503).json({ success: false, error: 'Giriş yapılandırılmamış (npm i bcryptjs jsonwebtoken)', code: 'AUTH_NOT_READY' });
}
app.post('/api/auth/register', authLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  if (!auth.ready()) return authNotReady(res);
  const b = req.body || {};
  const firstName = String(b.firstName || '').trim();
  const lastName = String(b.lastName || '').trim();
  const email = String(b.email || '').toLowerCase().trim();
  const phone = auth.normPhone(b.phone);
  const password = String(b.password || '');
  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ success: false, error: 'Ad, soyad, e-posta ve telefon zorunludur', code: 'BAD_REQUEST' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, error: 'Geçerli bir e-posta girin', code: 'BAD_EMAIL' });
  if (phone.replace(/\D/g, '').length < 10) return res.status(400).json({ success: false, error: 'Geçerli bir telefon girin', code: 'BAD_PHONE' });
  if (!auth.validPassword(password)) {
    return res.status(400).json({ success: false, error: 'Şifre tam 1 harf ve geri kalanı rakam olmalı (en az 6 karakter)', code: 'BAD_PASSWORD' });
  }
  try {
    const blocked = await db.prisma.blockedSignup.findFirst({ where: { until: { gt: Date.now() }, OR: [{ email }, { phone }] } });
    if (blocked) return res.status(403).json({ success: false, error: 'Bu e-posta veya telefon ile 40 gün boyunca yeni hesap açılamaz', code: 'SIGNUP_BLOCKED' });
    if (await db.prisma.user.findUnique({ where: { email } })) return res.status(409).json({ success: false, error: 'Bu e-posta zaten kayıtlı', code: 'EMAIL_TAKEN' });
    if (await db.prisma.user.findUnique({ where: { phone } })) return res.status(409).json({ success: false, error: 'Bu telefon zaten kayıtlı', code: 'PHONE_TAKEN' });
    const code = auth.genOtp();
    const user = await db.prisma.user.create({ data: {
      firstName, lastName, email, phone, passwordHash: await auth.hash(password),
      verified: false, otpCode: code, otpExpires: Date.now() + 10 * 60 * 1000,
    } });
    const sent = await sms.sendOtp(phone, code);
    res.json({ success: true, needOtp: true, email, phone, otpProvider: sent.provider, demoOtp: (!IS_PROD && sent.mode === 'demo') ? code : undefined });
  } catch (e) { dbError(res, e); }
});

// Telefon OTP doğrulama → hesabı aktifleştirir ve token verir
app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const email = String((req.body || {}).email || '').toLowerCase();
  const code = String((req.body || {}).code || '');
  try {
    const user = await db.prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    if (user.verified) return res.json({ success: true, token: auth.sign(user), user: auth.pub(user) });
    if (!user.otpCode || user.otpCode !== code || Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, error: 'Kod hatalı veya süresi dolmuş', code: 'BAD_OTP' });
    }
    const u = await db.prisma.user.update({ where: { id: user.id }, data: { verified: true, otpCode: null, otpExpires: 0 } });
    res.json({ success: true, token: auth.sign(u), user: auth.pub(u) });
  } catch (e) { dbError(res, e); }
});

// OTP yeniden gönder → SMS DEĞİL, E-POSTA. (İlk kod SMS ile 1 kez; tekrar gönderme maile gider.)
app.post('/api/auth/resend-otp', authLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const email = String((req.body || {}).email || '').toLowerCase();
  try {
    const user = await db.prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    if (user.verified) return res.status(400).json({ success: false, error: 'Zaten doğrulanmış', code: 'ALREADY_VERIFIED' });
    const code = auth.genOtp();
    await db.prisma.user.update({ where: { id: user.id }, data: { otpCode: code, otpExpires: Date.now() + 10 * 60 * 1000 } });
    const sent = await mailer.sendOtpEmail(user.email, code);   // e-posta ile (SMS'i tekrar kullanma)
    res.json({ success: true, otpChannel: 'email', otpMode: sent.mode, demoOtp: (!IS_PROD && sent.mode === 'demo') ? code : undefined });
  } catch (e) { dbError(res, e); }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  if (!auth.ready()) return authNotReady(res);
  const { email, password } = req.body || {};
  try {
    const user = await db.prisma.user.findUnique({ where: { email: String(email || '').toLowerCase() } });
    if (!user || !(await auth.compare(String(password || ''), user.passwordHash))) {
      return res.status(401).json({ success: false, error: 'E-posta veya şifre hatalı', code: 'BAD_CREDENTIALS' });
    }
    if (!user.verified) return res.status(403).json({ success: false, error: 'Önce telefonunuzu doğrulayın', code: 'NOT_VERIFIED', email: user.email });
    res.json({ success: true, token: auth.sign(user), user: auth.pub(user) });
  } catch (e) { dbError(res, e); }
});

// Şifremi unuttum → e-postaya 6 haneli KOD gönderilir
app.post('/api/auth/forgot', authLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const email = String((req.body || {}).email || '').toLowerCase();
  try {
    const user = await db.prisma.user.findUnique({ where: { email } });
    if (user) {
      const code = auth.genOtp();
      await db.prisma.user.update({ where: { id: user.id }, data: { resetToken: code, resetExpires: Date.now() + 60 * 60 * 1000 } });
      const sent = await mailer.sendResetCode(email, code);
      return res.json({ success: true, demoOtp: (!IS_PROD && sent.mode === 'demo') ? code : undefined });
    }
    // Güvenlik: kullanıcı yoksa da aynı yanıt (e-posta sızdırma önlenir)
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// Kod + yeni şifre ile sıfırla
app.post('/api/auth/reset', authLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const email = String((req.body || {}).email || '').toLowerCase();
  const code = String((req.body || {}).code || '').trim();
  const password = String((req.body || {}).password || '');
  if (!auth.validPassword(password)) {
    return res.status(400).json({ success: false, error: 'Şifre tam 1 harf ve geri kalanı rakam olmalı (en az 6 karakter)', code: 'BAD_PASSWORD' });
  }
  try {
    const user = await db.prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetToken || user.resetToken !== code || Date.now() > user.resetExpires) {
      return res.status(400).json({ success: false, error: 'Kod geçersiz veya süresi dolmuş', code: 'BAD_RESET' });
    }
    await db.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await auth.hash(password), resetToken: null, resetExpires: 0 } });
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// Şifre değiştir (giriş yapmış kullanıcı)
app.post('/api/auth/change-password', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const uid = auth.userIdFrom(req);
  if (uid === 'guest') return res.status(401).json({ success: false, code: 'NO_AUTH' });
  const password = String((req.body || {}).password || '');
  if (!auth.validPassword(password)) {
    return res.status(400).json({ success: false, error: 'Şifre tam 1 harf ve geri kalanı rakam olmalı (en az 6 karakter)', code: 'BAD_PASSWORD' });
  }
  try {
    await db.prisma.user.update({ where: { id: Number(uid) }, data: { passwordHash: await auth.hash(password) } });
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// Hesabı sil (e-posta + telefon + şifre doğrulanır) → 40 gün aynı e-posta/telefonla kayıt engeli
// Hesap silme — ADIM 1: kimlik doğrula, E-POSTA ile onay linki gönder (silme e-posta ile onaylanır).
app.post('/api/auth/delete-account', authLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  if (!auth.ready()) return authNotReady(res);
  const email = String((req.body || {}).email || '').toLowerCase().trim();
  const phone = auth.normPhone((req.body || {}).phone);
  const password = String((req.body || {}).password || '');
  try {
    const user = await db.prisma.user.findUnique({ where: { email } });
    if (!user || user.phone !== phone || !(await auth.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: 'E-posta, telefon veya şifre hatalı', code: 'BAD_CREDENTIALS' });
    }
    const token = auth.genToken();
    // Silme jetonu — şema değişmeden resetToken alanında 'del:' önekiyle tutulur (1 saat).
    await db.prisma.user.update({ where: { id: user.id }, data: { resetToken: 'del:' + token, resetExpires: Date.now() + 60 * 60 * 1000 } });
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const link = `${baseUrl}/profile?delete=${token}`;
    const sent = await mailer.sendDeleteLink(user.email, link);
    res.json({ success: true, needEmail: true, emailMode: sent.mode, demoLink: (!IS_PROD && sent.mode === 'demo') ? link : undefined });
  } catch (e) { dbError(res, e); }
});

// Hesap silme — ADIM 2: e-postadaki linkle onay → hesabı kalıcı sil.
app.post('/api/auth/confirm-delete', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const token = String((req.body || {}).token || '');
  if (!token) return res.status(400).json({ success: false, code: 'BAD_REQUEST' });
  try {
    const user = await db.prisma.user.findFirst({ where: { resetToken: 'del:' + token } });
    if (!user || Date.now() > user.resetExpires) {
      return res.status(400).json({ success: false, error: 'Silme bağlantısı geçersiz veya süresi dolmuş', code: 'BAD_TOKEN' });
    }
    const uid = String(user.id);
    await db.prisma.blockedSignup.create({ data: { email: user.email, phone: user.phone, until: Date.now() + 40 * 24 * 60 * 60 * 1000 } });
    await db.prisma.favorite.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.prisma.scanAnalysis.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.prisma.order.deleteMany({ where: { userId: uid } }).catch(() => {});
    await db.prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// Yardım/Destek — kullanıcı sorununu yazar, admin panelinde görünür (giriş şart değil)
app.post('/api/support', writeLimiter, async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const b = req.body || {};
  const message = String(b.message || '').trim();
  if (message.length < 3) return res.status(400).json({ success: false, error: 'Lütfen sorununuzu yazın', code: 'EMPTY' });
  const uid = auth.userIdFrom(req);   // giriş yapılmışsa id, değilse 'guest'
  try {
    let name = String(b.name || '').trim();
    let email = String(b.email || '').trim().toLowerCase();
    // Giriş yapılmışsa iletişim bilgisini kullanıcıdan al (istemciye güvenme)
    if (uid !== 'guest') {
      const u = await db.prisma.user.findUnique({ where: { id: Number(uid) } });
      if (u) { name = `${u.firstName} ${u.lastName}`.trim(); email = u.email; }
    }
    await db.prisma.supportTicket.create({
      data: { userId: uid === 'guest' ? '' : String(uid), name, email, message: message.slice(0, 2000), status: 'open' },
    });
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// Kullanıcının kendi destek mesajları + admin yanıtları (giriş gerekli)
app.get('/api/support/mine', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const uid = auth.userIdFrom(req);
  if (uid === 'guest') return res.json({ success: true, tickets: [] });
  try {
    const rows = await db.prisma.supportTicket.findMany({
      where: { userId: String(uid) }, orderBy: { createdAt: 'desc' }, take: 50,
    });
    const tickets = rows.map((t) => ({ id: t.id, message: t.message, reply: t.reply, status: t.status, repliedAt: t.repliedAt, createdAt: t.createdAt }));
    res.json({ success: true, tickets });
  } catch (e) { dbError(res, e); }
});

app.get('/api/auth/me', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const uid = auth.userIdFrom(req);
  if (uid === 'guest') return res.status(401).json({ success: false, code: 'NO_AUTH' });
  try {
    const user = await db.prisma.user.findUnique({ where: { id: Number(uid) } });
    if (!user) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    res.json({ success: true, user: auth.pub(user) });
  } catch (e) { dbError(res, e); }
});

// Plan/kota durumunu kullanıcıya kaydet (cihazlar arası senkron)
app.put('/api/auth/state', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const uid = auth.userIdFrom(req);
  if (uid === 'guest') return res.status(401).json({ success: false, code: 'NO_AUTH' });
  const b = req.body || {};
  try {
    const id = Number(uid);
    const current = await db.prisma.user.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    // GÜVENLİK: plan/paket/planSince/packSince ve kredi ARTIŞI client'tan ALINMAZ
    // (eskiden kullanıcı plan:'pro', imagesExtra:999 yazıp bedava premium alabiliyordu).
    //  - imagesUsed: yalnızca ARTABİLİR (kullanıcı 0'a çekip bedava hakkını geri kazanamaz).
    //  - imagesExtra: yalnızca AZALABİLİR (ücretli kredi harcanabilir ama kendine EKLEYEMEZ;
    //    kredi/plan yalnızca doğrulanmış ödemeyle sunucuda artar — bkz. /api/payments/confirm).
    const sentUsed = Number(b.imagesUsed);
    const nextUsed = Number.isFinite(sentUsed) ? Math.max(current.imagesUsed || 0, sentUsed) : (current.imagesUsed || 0);
    const sentExtra = Number(b.imagesExtra);
    const nextExtra = Number.isFinite(sentExtra) ? Math.min(current.imagesExtra || 0, Math.max(0, sentExtra)) : (current.imagesExtra || 0);
    const user = await db.prisma.user.update({ where: { id }, data: { imagesUsed: nextUsed, imagesExtra: nextExtra } });
    res.json({ success: true, user: auth.pub(user) });
  } catch (e) { dbError(res, e); }
});

// --- Favoriler (giriş yapılmışsa kullanıcıya, değilse guest) ---
app.get('/api/favorites', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = auth.userIdFrom(req);
  try {
    const favs = await db.prisma.favorite.findMany({ where: { userId }, include: { design: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, designs: favs.map((f) => db.designOut(f.design)) });
  } catch (e) { dbError(res, e); }
});

app.post('/api/favorites', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = auth.userIdFrom(req);
  const { designId } = req.body || {};
  if (!designId) return res.status(400).json({ success: false, error: 'designId gerekli', code: 'BAD_REQUEST' });
  try {
    const favorite = await db.prisma.favorite.upsert({
      where: { userId_designId: { userId, designId } },
      update: {},
      create: { userId, designId },
    });
    res.json({ success: true, favorite });
  } catch (e) { dbError(res, e); }
});

app.delete('/api/favorites/:designId', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = auth.userIdFrom(req);
  const designId = parseInt(req.params.designId, 10);
  try {
    await db.prisma.favorite.deleteMany({ where: { userId, designId } });
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// --- Tarama analizleri ---
app.post('/api/analysis', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = auth.userIdFrom(req);
  const b = req.body || {};
  try {
    const analysis = await db.prisma.scanAnalysis.create({
      data: {
        userId, toneKey: b.toneKey || null, undertone: b.undertone || null,
        fingerLength: b.fingerLength || null, nailShape: b.nailShape || null, hex: b.hex || null,
      },
    });
    res.json({ success: true, analysis });
  } catch (e) { dbError(res, e); }
});

app.get('/api/analysis/latest', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const userId = auth.userIdFrom(req);
  try {
    const analysis = await db.prisma.scanAnalysis.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, analysis });
  } catch (e) { dbError(res, e); }
});

// --- Ödeme (iyzico / Stripe / PayTR — anahtar yoksa demo) ---
app.get('/api/payments/status', (_req, res) => {
  res.json({ success: true, data: payments.status() });
});

app.post('/api/payments/checkout', async (req, res) => {
  const b = req.body || {};
  // GÜVENLİK: tutar İSTEMCİDEN alınmaz — itemId sunucu kataloğundan doğrulanır.
  if (!b.itemId || !catalog.isValidItem(b.itemId)) {
    return res.status(400).json({ success: false, error: 'Geçersiz ürün', code: 'BAD_ITEM' });
  }
  const currency = catalog.CURRENCIES.includes(b.currency) ? b.currency : 'USD';
  const amount = catalog.priceOf(b.itemId, currency);           // ← SUNUCU FİYATI (client amount YOK SAYILIR)
  if (amount == null || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Bu ürün için fiyat yok', code: 'NO_PRICE' });
  }
  const grant = catalog.grantOf(b.itemId);
  const kind = grant && grant.kind === 'pack' ? 'pack' : 'plan';
  const baseUrl = (req.headers.origin) || `${req.protocol}://${req.get('host')}`;
  const apiBase = `${req.protocol}://${req.get('host')}`;   // backend'in kendi adresi (iyzico callback POST'u buraya gelir)
  const userId = auth.userIdFrom(req);
  let buyer = null;
  if (userId !== 'guest' && db.ready()) {
    try {
      const u = await db.prisma.user.findUnique({ where: { id: Number(userId) } });
      if (u) buyer = { name: u.firstName, surname: u.lastName, email: u.email, phone: u.phone };
    } catch { /* kullanıcı okunamazsa misafir bilgisiyle devam */ }
  }
  try {
    const result = await payments.createCheckout({
      provider: b.provider, kind, itemId: b.itemId,
      itemName: b.itemName || b.itemId, amount,               // ← doğrulanmış tutar
      currency, userId, buyer, baseUrl, apiBase,
    });
    if (db.ready()) {
      try {
        await db.prisma.order.create({ data: {
          userId, kind, itemId: String(b.itemId),
          itemName: b.itemName || String(b.itemId), amount, currency,
          provider: result.provider || 'demo', status: 'pending',
          ref: result.ref || '', providerRef: result.providerRef || result.ref || '',
        } });
        console.log(`📝 Sipariş kaydedildi (pending): ref=${result.ref} · ${b.itemId} · ${amount} ${currency}`);
      } catch (e) { console.error('❌ SİPARİŞ KAYDI BAŞARISIZ (şema eski olabilir → yerel-pg-baslat.bat ile db push):', e.message); }
    }
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message, code: 'CHECKOUT_ERROR' });
  }
});

// Ödeme onayı → planı/krediyi SUNUCUDA verir (istemciye güvenilmez). İdempotent:
// yalnızca 'pending' → 'paid' geçişinde bir kez uygulanır (çift callback güvenli).
app.post('/api/payments/confirm', async (req, res) => {
  const { ref } = req.body || {};
  const userId = auth.userIdFrom(req);
  if (userId === 'guest') return res.status(401).json({ success: false, code: 'NO_AUTH' });
  if (!db.ready() || !ref) return res.json({ success: true, data: { status: 'pending', ref: ref || null } });
  try {
    // Sahiplik kontrolü: yalnızca bu kullanıcının siparişi.
    const order = await db.prisma.order.findFirst({ where: { ref: String(ref), userId } });
    if (!order) return res.status(404).json({ success: false, error: 'Sipariş bulunamadı', code: 'ORDER_NOT_FOUND' });
    if (order.status === 'paid') return res.json({ success: true, data: { status: 'paid', ref, already: true } }); // idempotent
    // GÜVENLİK: demo sipariş ÜRETİMDE plan/kredi VERMEZ (gerçek ödeme yok → bedava premium engellenir).
    if (order.provider === 'demo' && IS_PROD) {
      return res.status(400).json({ success: false, error: 'Ödeme doğrulanamadı', code: 'PAYMENT_NOT_VERIFIED', status: 'demo' });
    }
    // SAĞLAYICIDAN GERÇEK ÖDEME TEYİDİ (Stripe/iyzico retrieve). Demo (dev) → izinli.
    const v = await payments.verifyPayment({ provider: order.provider, ref: order.providerRef || order.ref, amount: order.amount, currency: order.currency });
    if (!v.ok) {
      // 'error' (geçici) → pending bırak, tekrar denenebilir; aksi halde 'failed'.
      await db.prisma.order.updateMany({ where: { id: order.id, status: 'pending' }, data: { status: v.status === 'error' || v.status === 'unverifiable' ? 'pending' : 'failed' } }).catch(() => {});
      return res.status(402).json({ success: false, error: 'Ödeme doğrulanamadı', code: 'PAYMENT_NOT_VERIFIED', status: v.status });
    }
    // İdempotent: yalnızca pending→paid geçişinde bir kez uygula (çift callback güvenli).
    const upd = await db.prisma.order.updateMany({ where: { id: order.id, status: 'pending' }, data: { status: 'paid' } });
    if (upd.count > 0) {
      const applied = await catalog.applyGrant(db.prisma, userId, order.itemId, Date.now());
      if (applied) console.log(`💳 Ödeme DOĞRULANDI & uygulandı → kullanıcı ${userId}: ${JSON.stringify(applied)}`);
    }
    return res.json({ success: true, data: { status: 'paid', ref } });
  } catch (e) {
    console.error('❌ confirm/grant hatası:', e.message);
    return res.status(500).json({ success: false, error: e.message, code: 'CONFIRM_ERROR' });
  }
});

// iyzico Checkout Form dönüşü: iyzico ödemeden sonra token'ı buraya POST eder ("Cannot POST /shop"
// hatasının çözümü). Ödemeyi doğrula → plan/krediyi ver → tarayıcıyı ön yüz /shop'a 302 ile döndür.
app.post('/api/payments/callback/iyzico', express.urlencoded({ extended: false }), async (req, res) => {
  const ref = String(req.query.ref || '');
  const feRaw = String(req.query.fe || '');
  const token = String((req.body && (req.body.token || req.body.paymentId)) || '');
  let paid = false;
  try {
    if (db.ready() && ref) {
      const order = await db.prisma.order.findFirst({ where: { ref } });
      if (order && order.status !== 'paid') {
        const v = await payments.verifyPayment({ provider: 'iyzico', ref: token || order.providerRef, amount: order.amount, currency: order.currency });
        if (v.ok) {
          const upd = await db.prisma.order.updateMany({ where: { id: order.id, status: 'pending' }, data: { status: 'paid' } });
          if (upd.count > 0) await catalog.applyGrant(db.prisma, order.userId, order.itemId, Date.now());
          paid = true;
          console.log(`💳 iyzico callback DOĞRULANDI & uygulandı → sipariş ${order.id}`);
        }
      } else if (order && order.status === 'paid') { paid = true; }
    }
  } catch (e) { console.error('❌ iyzico callback:', e.message); }
  // Güvenli ön yüz adresi (açık yönlendirme engeli): APP_URL > localhost fe > backend host.
  let fe = process.env.APP_URL || '';
  if (!fe) fe = /^https?:\/\/localhost(:\d+)?$/i.test(feRaw) ? feRaw : `${req.protocol}://${req.get('host')}`;
  res.redirect(302, `${fe.replace(/\/+$/, '')}/shop?paid=${paid ? 1 : 0}&provider=iyzico&ref=${encodeURIComponent(ref)}`);
});

// PayTR sunucu→sunucu bildirimi (gerçek ödeme doğrulaması — hash imzası). PayTR yanıt olarak
// düz "OK" bekler; almazsa bildirimi tekrar dener. iyzico/Stripe pull-doğrulaması confirm'de yapılır.
app.post('/api/payments/callback/paytr', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const v = payments.verifyPaytrCallback(req.body || {});
    if (!v.ok) return res.status(400).send('PAYTR imza uyuşmadı');
    if (db.ready() && v.paid) {
      const order = await db.prisma.order.findFirst({ where: { OR: [{ ref: String(v.merchant_oid) }, { providerRef: String(v.merchant_oid) }] } });
      if (order && order.status === 'pending') {
        await db.prisma.order.updateMany({ where: { id: order.id, status: 'pending' }, data: { status: 'paid' } });
        await catalog.applyGrant(db.prisma, order.userId, order.itemId, Date.now());
        console.log(`💳 PayTR callback DOĞRULANDI & uygulandı → sipariş ${order.id}`);
      }
    }
    res.send('OK');
  } catch (e) { console.error('❌ PayTR callback:', e.message); res.status(500).send('error'); }
});

// Yönetici uçları (rol korumalı) — 404 yakalayıcıdan ÖNCE bağlanır
admin.mount(app, { db, auth, ai, payments, sms, mailer });

// /api dışındaki GET istekleri → Angular index.html (SPA yönlendirme). /api → 404 JSON.
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && HAS_CLIENT) {
    return res.sendFile(path.join(CLIENT_DIR, 'index.html'));
  }
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

function handleAiError(res, e) {
  console.error('❌ AI hatası:', e.message);
  const status = e.httpStatus || (e.status === 401 ? 401 : e.status === 429 ? 429 : 500);
  const code = e.code || (e.status === 401 ? 'INVALID_API_KEY' : e.status === 429 ? 'RATE_LIMITED' : 'AI_ERROR');
  res.status(status).json({ success: false, error: e.message || 'AI servisinde hata', code });
}

app.listen(PORT, () => {
  console.log('');
  console.log('🌟 ═══════════════════════════════════════');
  console.log('   ngNailArt — Backend');
  console.log('   ═══════════════════════════════════════');
  console.log(`🚀 API:     http://localhost:${PORT}/api/health`);
  console.log(`🤖 Durum:   http://localhost:${PORT}/api/ai/status`);
  console.log('');
});
