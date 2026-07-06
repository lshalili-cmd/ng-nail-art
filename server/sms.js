// ngNailArt backend — SMS / OTP (Twilio veya Netgsm; anahtarsız DEMO)
// DEMO modda gerçek SMS gitmez; kod API yanıtında döner ve konsola yazılır (test için).
require('dotenv').config();
const https = require('https');

function tryRequire(n) { try { return require(n); } catch { return null; } }
function realKey(v) { return !!v && !/your-|-here$/i.test(v); }

/** Hangi sağlayıcı yapılandırılmış? */
function provider() {
  if (realKey(process.env.TWILIO_ACCOUNT_SID) && realKey(process.env.TWILIO_AUTH_TOKEN) && realKey(process.env.TWILIO_FROM)) return 'twilio';
  if (realKey(process.env.NETGSM_USER) && realKey(process.env.NETGSM_PASS) && realKey(process.env.NETGSM_HEADER)) return 'netgsm';
  return 'demo';
}
function ready() { return provider() !== 'demo'; }

/** OTP kodunu telefona gönderir. Dönüş: { mode:'live'|'demo', provider, code? } (code yalnızca demo'da). */
async function sendOtp(phone, code) {
  const p = provider();
  const msg = `Miracle Nail Art dogrulama kodunuz: ${code}`;
  try {
    if (p === 'twilio') {
      const Twilio = tryRequire('twilio');
      if (!Twilio) throw new Error('twilio paketi kurulu değil (npm i twilio)');
      const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ from: process.env.TWILIO_FROM, to: phone, body: msg });
      return { mode: 'live', provider: 'twilio' };
    }
    if (p === 'netgsm') {
      const params = new URLSearchParams({
        usercode: process.env.NETGSM_USER, password: process.env.NETGSM_PASS,
        gsmno: phone.replace(/^\+/, ''), message: msg, msgheader: process.env.NETGSM_HEADER,
      });
      const body = await httpGet('https://api.netgsm.com.tr/sms/send/get/?' + params.toString());
      if (/^0[0-9]/.test(body.trim())) return { mode: 'live', provider: 'netgsm' };
      throw new Error('Netgsm yanıtı: ' + body.trim());
    }
  } catch (e) {
    console.warn('📱 SMS gönderilemedi, DEMO moduna düşülüyor:', e.message);
  }
  console.log(`📱 [DEMO SMS] ${phone} → ${msg}`);
  return { mode: 'demo', provider: p, code };
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve(b)); }).on('error', reject);
  });
}

module.exports = { ready, provider, sendOtp };
