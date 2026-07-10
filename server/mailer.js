// ngNailArt backend — E-posta (SMTP / nodemailer; anahtarsız DEMO)
// DEMO modda gerçek e-posta gitmez; içerik API yanıtında döner ve konsola yazılır.
require('dotenv').config();

function tryRequire(n) { try { return require(n); } catch { return null; } }
function realKey(v) { return !!v && !/your-|-here$/i.test(v); }

function ready() { return realKey(process.env.SMTP_HOST) && realKey(process.env.SMTP_USER); }

/** Ortak gönderim. Dönüş: { mode:'live'|'demo' }. */
async function send(email, subject, html) {
  const nodemailer = tryRequire('nodemailer');
  if (ready() && nodemailer) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email, subject, html });
      return { mode: 'live' };
    } catch (e) {
      console.warn('✉️  E-posta gönderilemedi, DEMO moduna düşülüyor:', e.message);
    }
  }
  return { mode: 'demo' };
}

/** Şifre sıfırlama bağlantısı. */
async function sendResetLink(email, link) {
  const r = await send(email, 'Miracle Nail Art — Şifre sıfırlama',
    `<p>Şifrenizi sıfırlamak için <a href="${link}">buraya tıklayın</a>. Bağlantı 1 saat geçerlidir.</p>
     <p>Bu isteği siz yapmadıysanız yok sayın.</p>`);
  if (r.mode === 'demo') console.log(`✉️  [DEMO EMAIL] ${email} → şifre sıfırlama: ${link}`);
  return r.mode === 'demo' ? { mode: 'demo', link } : r;
}

/** Doğrulama kodunu e-postayla gönderir (SMS resend yerine — 2. gönderim maile gider). */
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

module.exports = { ready, sendResetLink, sendOtpEmail, sendDeleteLink };
