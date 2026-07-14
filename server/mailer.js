// ngNailArt backend — E-posta (Brevo HTTP API veya SMTP; anahtarsız DEMO)
// Öncelik: Brevo API (Render'da çalışır, SMTP portu gerekmez) → SMTP (yerel) → DEMO.
// DEMO modda gerçek e-posta gitmez; içerik API yanıtında döner ve konsola yazılır.
require('dotenv').config();
const https = require('https');

function tryRequire(n) { try { return require(n); } catch { return null; } }
function realKey(v) { return !!v && !/your-|-here$/i.test(v); }

const brevoReady = () => realKey(process.env.BREVO_API_KEY);
const smtpReady = () => realKey(process.env.SMTP_HOST) && realKey(process.env.SMTP_USER);
/** En az bir gerçek e-posta sağlayıcısı yapılandırılmış mı? */
function ready() { return brevoReady() || smtpReady(); }

/** Gönderen e-posta: Brevo'da DOĞRULANMIŞ olmalı (genelde Brevo giriş e-postan). */
function senderEmail() {
  return process.env.BREVO_SENDER || process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@miraclenailart.app';
}

/** Brevo transactional e-posta API'si (HTTPS POST — Render uyumlu). */
function brevoSend(email, subject, html) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      sender: { name: 'Miracle Nail Art', email: senderEmail() },
      to: [{ email }],
      subject,
      htmlContent: html,
    });
    const req = https.request({
      hostname: 'api.brevo.com', path: '/v3/smtp/email', method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'accept': 'application/json',
        'content-length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let b = ''; res.on('data', (c) => (b += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`Brevo ${res.statusCode}: ${b}`));
      });
    });
    req.on('error', reject);
    req.write(payload); req.end();
  });
}

/** Ortak gönderim. Dönüş: { mode:'live'|'demo', provider? }. */
async function send(email, subject, html) {
  // 1) Brevo API (öncelik — Render'da çalışan tek yol)
  if (brevoReady()) {
    try { await brevoSend(email, subject, html); return { mode: 'live', provider: 'brevo' }; }
    catch (e) { console.warn('✉️  Brevo gönderilemedi:', e.message); }
  }
  // 2) SMTP (yerel geliştirme — Render'da portlar kapalı)
  const nodemailer = tryRequire('nodemailer');
  if (smtpReady() && nodemailer) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({ from: senderEmail(), to: email, subject, html });
      return { mode: 'live', provider: 'smtp' };
    } catch (e) {
      console.warn('✉️  SMTP e-posta gönderilemedi, DEMO moduna düşülüyor:', e.message);
    }
  }
  return { mode: 'demo' };
}

/** Şifre sıfırlama KODU (6 haneli) — e-postayla gönderilir. */
async function sendResetCode(email, code) {
  const r = await send(email, 'Miracle Nail Art — Şifre sıfırlama kodu',
    `<p>Şifre sıfırlama kodunuz:</p>
     <p style="font-size:26px;font-weight:bold;letter-spacing:4px;color:#b8912e">${code}</p>
     <p>Kod 1 saat geçerlidir. Bu kodu ve yeni şifrenizi uygulamada girin.</p>
     <p>Bu isteği siz yapmadıysanız yok sayın.</p>`);
  if (r.mode === 'demo') console.log(`✉️  [DEMO EMAIL] ${email} → şifre sıfırlama kodu: ${code}`);
  return r.mode === 'demo' ? { mode: 'demo', code } : r;
}

/** Doğrulama kodunu e-postayla gönderir (kayıt + tekrar gönder). */
async function sendOtpEmail(email, code) {
  const r = await send(email, 'Miracle Nail Art — Doğrulama kodu',
    `<p>Doğrulama kodunuz:</p>
     <p style="font-size:26px;font-weight:bold;letter-spacing:4px;color:#b8912e">${code}</p>
     <p>Kod 10 dakika geçerlidir. Bu isteği siz yapmadıysanız yok sayın.</p>`);
  if (r.mode === 'demo') console.log(`✉️  [DEMO EMAIL] ${email} → doğrulama kodu: ${code}`);
  return r.mode === 'demo' ? { mode: 'demo', code } : r;
}

/** Hesap silme onay bağlantısı. */
async function sendDeleteLink(email, link) {
  const r = await send(email, 'Miracle Nail Art — Hesap silme onayı',
    `<p>Hesabınızı kalıcı olarak silmek için <a href="${link}">buraya tıklayın</a>. Bağlantı 1 saat geçerlidir.</p>
     <p><b>Bu işlem geri alınamaz.</b> Bu isteği siz yapmadıysanız hemen yok sayın.</p>`);
  if (r.mode === 'demo') console.log(`✉️  [DEMO EMAIL] ${email} → hesap silme: ${link}`);
  return r.mode === 'demo' ? { mode: 'demo', link } : r;
}

/** Hangi sağlayıcı aktif (log için). */
function provider() { return brevoReady() ? 'brevo' : (smtpReady() ? 'smtp' : 'demo'); }

module.exports = { ready, provider, sendResetCode, sendOtpEmail, sendDeleteLink };
