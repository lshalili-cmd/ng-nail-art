/**
 * GEMINI TEŞHİS (SDK'SIZ, doğrudan native endpoint) — AQ. anahtarlarıyla da çalışır.
 * Kullanım (server klasöründen):
 *   node scripts/test-gemini.js
 *   node scripts/test-gemini.js AQ.xxxxx      (anahtarı doğrudan da verebilirsin)
 *
 * Çıktı: "✅ ÇALIŞIYOR" + test-gemini.png  ya da  SORUNUN TAM NEDENİ.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- anahtarı bul: argv > .env ---
function keyFromEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const txt = fs.readFileSync(envPath, 'utf8');
    const m = txt.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/m);
    return m ? m[1].replace(/^['"]|['"]$/g, '') : null;
  } catch { return null; }
}
const key = (process.argv[2] || keyFromEnvFile() || '').trim();

console.log('\n===== GEMINI TEŞHİS (native endpoint) =====\n');
if (!key || key.startsWith('your-')) {
  console.log('❌ Anahtar yok. https://aistudio.google.com/apikey → Create API key.');
  console.log('   Sonra: node scripts/test-gemini.js  (veya anahtarı argüman ver).\n');
  process.exit(0);
}
console.log('Anahtar (ilk 6):', key.slice(0, 6) + '…', '| uzunluk:', key.length);
console.log(key.startsWith('AQ.') ? '→ Yeni "AQ." formatı (geçerli).' : (key.startsWith('AIza') ? '→ Eski "AIza" formatı (geçerli).' : '→ Bilinmeyen format, yine de denenecek.'));

const prompt = 'Professional nail art photography, close-up of an elegant female hand with ' +
  'glossy red almond nails, studio lighting, photorealistic, no text.';

function tryModel(model) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key, 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ status: 0, data: JSON.stringify({ error: { message: e.message } }) }));
    req.write(body); req.end();
  });
}

(async () => {
  const models = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation', 'gemini-3.1-flash-image'];
  for (const model of models) {
    process.stdout.write(`\nDeneniyor: ${model} ... `);
    const { status, data } = await tryModel(model);
    let json; try { json = JSON.parse(data); } catch { json = {}; }

    if (status === 200) {
      const parts = (json?.candidates?.[0]?.content?.parts) || [];
      const b64 = parts.find((p) => p?.inlineData?.data)?.inlineData?.data;
      if (b64) {
        const out = path.join(__dirname, '..', 'test-gemini.png');
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        console.log('✅ ÇALIŞIYOR!');
        console.log('   Görsel kaydedildi →', out, '(açıp bak)');
        console.log('\n🎉 Anahtarın gerçek görsel üretiyor. Backend\'i başlat, uygulamada AI aktif.\n');
        return;
      }
      console.log('200 döndü ama görsel yok (sadece metin). Sıradaki model...');
      continue;
    }

    const msg = json?.error?.message || data.slice(0, 200);
    console.log(`HATA (HTTP ${status}).`);
    console.log('   →', msg);
    if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(msg)) {
      console.log('   💡 Anahtar geçersiz görünüyor. aistudio.google.com/apikey → yeni anahtar.');
    } else if (status === 403) {
      console.log('   💡 Yetki/izin sorunu. Anahtarın bu API\'ye erişimi yok olabilir.');
    } else if (status === 404 || /not found|not supported/i.test(msg)) {
      console.log('   💡 Bu model hesabında yok; sıradaki model deneniyor.');
    } else if (status === 429 || /quota|rate/i.test(msg)) {
      console.log('   💡 Kota/limit doldu. Biraz bekle (günlük ~500 ücretsiz).');
    }
  }
  console.log('\n❌ Hiçbir model görsel üretemedi. Yukarıdaki HTTP kodu + mesaj sorunu gösteriyor.');
  console.log('   Bu çıktıyı bana yapıştır, kesin çözelim.\n');
})();
