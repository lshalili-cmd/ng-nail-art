// ngNailArt backend — E-posta (SMTP / nodemailer; anahtarsız DEMO)
// DEMO modda gerçek e-posta gitmez; sıfırlama bağlantısı API yanıtında döner ve konsola yazılır.
require('dotenv').config();

function tryRequire(n) { try { return require(n); } catch { return null; } }
function realKey(v) { return !!v && !/your-|-here$/i.test(v); }

function ready() { return realKey(process.env.SMTP_HOST) && realKey(process.env.SMTP_USER); }

/** Şifre sıfırlama bağlantısını e-postayla gönderir. Dönüş: { mode:'live'|'demo', link? }. */
async function sendResetLink(email, link) {
  const nodemailer = tryRequire('nodemailer');
  if (ready() && nodemailer) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email,
        subject: 'Miracle Nail Art — Şifre sıfırlama',
        html: `<p>Şifrenizi sıfırlamak için <a href="${link}">buraya tıklayın</a>. Bağlantı 1 saat geçerlidir.</p>
               <p>Bu isteği siz yapmadıysanız yok sayın.</p>`,
      });
      return { mode: 'live' };
    } catch (e) {
      console.warn('✉️  E-posta gönderilemedi, DEMO moduna düşülüyor:', e.message);
    }
  }
  console.log(`✉️  [DEMO EMAIL] ${email} → ${link}`);
  return { mode: 'demo', link };
}

module.exports = { ready, sendResetLink };
