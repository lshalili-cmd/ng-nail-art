// GEÇİCİ, SADECE YEREL TEST betiği.
// Image-to-image "düzenleme" akışını (server/ai.js generateImage, editMode) Express/DB/auth/kota
// katmanlarını atlayarak gerçek bir el fotoğrafıyla dener. Deploy edilmez, .env/prod'a dokunmaz.
//
// Kullanım (server/ klasöründen):
//   node scripts/test-image-edit.js <el-fotografi-yolu> ["tasarim metni"]
//
// Örnek:
//   node scripts/test-image-edit.js "C:\Users\metin\Desktop\el.jpg" "red glossy nails with gold line"
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ai = require('../ai');

async function main() {
  const imgPath = process.argv[2];
  const promptText = process.argv[3] || 'Classic red glossy nail polish';
  if (!imgPath || !fs.existsSync(imgPath)) {
    console.error('Kullanım: node scripts/test-image-edit.js <el-fotografi-yolu> ["tasarim metni"]');
    process.exit(1);
  }

  ai.initProviders();
  const st = ai.status();
  console.log('--- AI durumu ---');
  console.log(st);
  if (!st.configured) {
    console.error('\nHiçbir AI sağlayıcısı yapılandırılmamış. server/.env içine en az bir anahtar ekleyin, örn:');
    console.error('  FAL_KEY=...             (fal.ai FLUX Kontext — önerilen, image-to-image destekler)');
    console.error('  GEMINI_API_KEY=...      (ücretsiz katman, kart gerekmez)');
    console.error('  OPENAI_API_KEY=...      (gpt-image-1, images.edit)');
    console.error('  REPLICATE_API_TOKEN=... (flux-kontext-pro, sadece tier:"wow")');
    process.exit(1);
  }

  const buf = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;

  const outDir = path.join(__dirname, '..', 'test-output');
  fs.mkdirSync(outDir, { recursive: true });

  const input = {
    prompt: promptText,
    style: 'luxury',
    shape: 'almond',
    colors: ['red', 'gold'],
    finish: 'glossy',
    image: dataUrl,
  };

  console.log('\n--- İstek payload (image kısaltıldı) ---');
  console.log({ ...input, image: `${dataUrl.slice(0, 60)}... (${buf.length} bayt, ${mime})` });

  const t0 = Date.now();
  const result = await ai.generateImage(input, outDir);
  console.log(`\n--- Sonuç (${Date.now() - t0}ms) ---`);
  console.log(result);
  console.log(`\nÇıktı dosyası: ${path.join(outDir, result.filename)}`);
}

main().catch((e) => {
  console.error('\n--- HATA ---');
  console.error(e);
  process.exit(1);
});
