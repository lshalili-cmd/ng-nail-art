/**
 * POLLINATIONS TEŞHİS — anahtarsız, ücretsiz görsel AI'sı senin makinende çalışıyor mu?
 * Kullanım (server klasöründen):
 *   node scripts/test-pollinations.js
 *
 * Çıktı: "✅ ÇALIŞIYOR" + test-pollinations.jpg  ya da  sorunun nedeni.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const prompt = 'professional nail art photography, close-up of an elegant female hand with ' +
  'glossy red almond nails, studio lighting, photorealistic, no text';
const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) +
  '?width=768&height=1024&nologo=true&model=flux';

console.log('\n===== POLLINATIONS TEŞHİS (ücretsiz, anahtarsız) =====\n');
console.log('İstek gönderiliyor... (ilk üretim 10-30 sn sürebilir)\n');

const t0 = Date.now();
https.get(url, (res) => {
  const ct = res.headers['content-type'] || '';
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (res.statusCode === 200 && ct.startsWith('image')) {
      const out = path.join(__dirname, '..', 'test-pollinations.jpg');
      fs.writeFileSync(out, buf);
      console.log(`✅ ÇALIŞIYOR!  (${secs}s, ${(buf.length / 1024).toFixed(0)} KB)`);
      console.log('   Görsel kaydedildi →', out, '(açıp bak)');
      console.log('\n🎉 Ücretsiz görsel AI çalışıyor. Uygulamaya bunu bağlayabilirim.\n');
    } else {
      console.log(`❌ Beklenen görsel gelmedi. HTTP ${res.statusCode}, tür: ${ct}`);
      console.log('   Cevap:', buf.toString('utf8').slice(0, 300));
      console.log('\n   Bu çıktıyı bana yapıştır, başka bir ücretsiz servise geçeriz.\n');
    }
  });
}).on('error', (e) => {
  console.log('❌ Bağlanılamadı:', e.message);
  console.log('   (İnternet / güvenlik duvarı olabilir.) Bu çıktıyı bana yapıştır.\n');
});
