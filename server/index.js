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
const auth = require('./auth');
const sms = require('./sms');
const mailer = require('./mailer');

ai.initProviders();
payments.initProviders();
if (!auth.ready()) console.warn('ℹ️  Auth paketleri yok (npm i bcryptjs jsonwebtoken) — giriş uçları 503, guest modu çalışır.');
if (!sms.ready()) console.warn('ℹ️  SMS sağlayıcısı yok — OTP DEMO modunda (kod yanıtta döner). Twilio/Netgsm anahtarı ekleyin.');
if (!mailer.ready()) console.warn('ℹ️  SMTP yok — şifre sıfırlama e-postası DEMO modunda (bağlantı yanıtta döner).');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '4mb' }));

// Üretilen görsellerin klasörü + statik sunum
const IMG_DIR = path.join(__dirname, 'images', 'ai-generated');
fs.mkdirSync(IMG_DIR, { recursive: true });
app.use('/images', express.static(path.join(__dirname, 'images'), {
  setHeaders: (res) => res.set('Cache-Control', 'no-cache'),
}));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'healthy', time: new Date().toISOString() } });
});

app.get('/api/ai/status', (_req, res) => {
  res.json({ success: true, data: ai.status() });
});

app.post('/api/ai/chat', async (req, res) => {
  const { prompt, language } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Lütfen bir tasarım isteği girin', code: 'EMPTY_PROMPT' });
  }
  try {
    console.log(`🎨 AI chat: "${prompt.slice(0, 60)}..."`);
    const data = await ai.chat(prompt, language);
    res.json({ success: true, data, meta: { provider: ai.status().provider, model: ai.status().model, timestamp: new Date().toISOString() } });
  } catch (e) {
    handleAiError(res, e);
  }
});

app.post('/api/ai/generate-image', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: 'Prompt gerekli', code: 'EMPTY_PROMPT' });
  }
  try {
    console.log(`🖼️  Görsel üretimi: "${prompt.slice(0, 50)}..."`);
    const data = await ai.generateImage(req.body, IMG_DIR);
    console.log(`✅ Görsel kaydedildi: ${data.filename} (${Math.round(data.size / 1024)}KB, ${data.provider})`);
    res.json({ success: true, data });
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

app.post('/api/designs', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ success: false, error: 'name gerekli', code: 'BAD_REQUEST' });
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
app.post('/api/auth/register', async (req, res) => {
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
    if (await db.prisma.user.findUnique({ where: { email } })) return res.status(409).json({ success: false, error: 'Bu e-posta zaten kayıtlı', code: 'EMAIL_TAKEN' });
    if (await db.prisma.user.findUnique({ where: { phone } })) return res.status(409).json({ success: false, error: 'Bu telefon zaten kayıtlı', code: 'PHONE_TAKEN' });
    const code = auth.genOtp();
    const user = await db.prisma.user.create({ data: {
      firstName, lastName, email, phone, passwordHash: await auth.hash(password),
      verified: false, otpCode: code, otpExpires: Date.now() + 10 * 60 * 1000,
    } });
    const sent = await sms.sendOtp(phone, code);
    res.json({ success: true, needOtp: true, email, phone, otpProvider: sent.provider, demoOtp: sent.mode === 'demo' ? code : undefined });
  } catch (e) { dbError(res, e); }
});

// Telefon OTP doğrulama → hesabı aktifleştirir ve token verir
app.post('/api/auth/verify-otp', async (req, res) => {
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

// OTP yeniden gönder
app.post('/api/auth/resend-otp', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const email = String((req.body || {}).email || '').toLowerCase();
  try {
    const user = await db.prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ success: false, code: 'NOT_FOUND' });
    if (user.verified) return res.status(400).json({ success: false, error: 'Zaten doğrulanmış', code: 'ALREADY_VERIFIED' });
    const code = auth.genOtp();
    await db.prisma.user.update({ where: { id: user.id }, data: { otpCode: code, otpExpires: Date.now() + 10 * 60 * 1000 } });
    const sent = await sms.sendOtp(user.phone, code);
    res.json({ success: true, otpProvider: sent.provider, demoOtp: sent.mode === 'demo' ? code : undefined });
  } catch (e) { dbError(res, e); }
});

app.post('/api/auth/login', async (req, res) => {
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

// Şifremi unuttum → e-posta ile sıfırlama bağlantısı
app.post('/api/auth/forgot', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const email = String((req.body || {}).email || '').toLowerCase();
  try {
    const user = await db.prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = auth.genToken();
      await db.prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetExpires: Date.now() + 60 * 60 * 1000 } });
      const baseUrl = (req.headers.origin) || `${req.protocol}://${req.get('host')}`;
      const link = `${baseUrl}/profile?reset=${token}`;
      const sent = await mailer.sendResetLink(email, link);
      return res.json({ success: true, demoLink: sent.mode === 'demo' ? link : undefined });
    }
    // Güvenlik: kullanıcı yoksa da aynı yanıt (e-posta sızdırma önlenir)
    res.json({ success: true });
  } catch (e) { dbError(res, e); }
});

// Sıfırlama jetonuyla yeni şifre belirle
app.post('/api/auth/reset', async (req, res) => {
  if (!db.ready()) return dbNotReady(res);
  const token = String((req.body || {}).token || '');
  const password = String((req.body || {}).password || '');
  if (!auth.validPassword(password)) {
    return res.status(400).json({ success: false, error: 'Şifre tam 1 harf ve geri kalanı rakam olmalı (en az 6 karakter)', code: 'BAD_PASSWORD' });
  }
  try {
    const user = await db.prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || !user.resetToken || Date.now() > user.resetExpires) {
      return res.status(400).json({ success: false, error: 'Bağlantı geçersiz veya süresi dolmuş', code: 'BAD_RESET' });
    }
    await db.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await auth.hash(password), resetToken: null, resetExpires: 0 } });
    res.json({ success: true });
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
    const user = await db.prisma.user.update({
      where: { id: Number(uid) },
      data: {
        plan: b.plan, planSince: Number(b.planSince) || 0,
        imagesUsed: Number(b.imagesUsed) || 0, imagesExtra: Number(b.imagesExtra) || 0,
        packId: b.packId || null, packSince: Number(b.packSince) || 0,
      },
    });
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
  if (!b.itemId || b.amount == null) {
    return res.status(400).json({ success: false, error: 'itemId ve amount gerekli', code: 'BAD_REQUEST' });
  }
  const baseUrl = (req.headers.origin) || `${req.protocol}://${req.get('host')}`;
  const userId = auth.userIdFrom(req);
  try {
    const result = await payments.createCheckout({
      provider: b.provider, kind: b.kind || 'plan', itemId: b.itemId,
      itemName: b.itemName || b.itemId, amount: Number(b.amount),
      currency: b.currency || 'USD', userId, baseUrl,
    });
    // Siparişi kaydet (DB varsa; yoksa sessiz geç)
    if (db.ready()) {
      try {
        await db.prisma.order.create({ data: {
          userId, kind: b.kind || 'plan', itemId: String(b.itemId),
          itemName: b.itemName || String(b.itemId), amount: Number(b.amount), currency: b.currency || 'USD',
          provider: result.provider || 'demo', status: 'pending', ref: result.ref || '',
        } });
      } catch { /* migrate edilmemişse geç */ }
    }
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message, code: 'CHECKOUT_ERROR' });
  }
});

// Demo/başarı onayı — gerçek sağlayıcıda bunu webhook/callback yapar
app.post('/api/payments/confirm', async (req, res) => {
  const { ref } = req.body || {};
  const userId = auth.userIdFrom(req);
  if (db.ready() && ref) {
    try {
      await db.prisma.order.updateMany({ where: { ref: String(ref), userId }, data: { status: 'paid' } });
    } catch { /* geç */ }
  }
  res.json({ success: true, data: { status: 'paid', ref: ref || null } });
});

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' }));

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
