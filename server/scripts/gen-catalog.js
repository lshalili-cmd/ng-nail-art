/**
 * Katalog görsellerini TEK SEFERLİK toplu üretir → public/designs/design-<id>.jpg
 * Çalışma anında değil, sadece bir kez çalıştırılır; vitrin sonra tamamen statiktir.
 *
 * Kullanım (server klasöründen):
 *   node scripts/gen-catalog.js
 *
 * Sağlayıcı önceliği (.env):
 *   - GEMINI_API_KEY  → Gemini 2.5 Flash Image (ÜCRETSİZ, ~500/gün)  [önerilen]
 *   - REPLICATE_API_TOKEN → Flux schnell (çok ucuz)
 *
 * Not: Flux 1.1 Pro burada KULLANILMAZ; o yalnızca kullanıcıya özel üretim içindir.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', '..', 'public', 'designs');
fs.mkdirSync(OUT, { recursive: true });

// data.service.ts'teki 9 tasarımla birebir aynı sıra/isim
const DESIGNS = [
  { id: 1, name: 'Gold Chrome', desc: 'gold chrome mirror finish, almond nails, luxury' },
  { id: 2, name: 'Pink Ombré', desc: 'soft pink to nude ombré gradient, oval nails, elegant' },
  { id: 3, name: 'Galaxy Dreams', desc: 'deep blue purple galaxy with fine glitter stars, coffin nails' },
  { id: 4, name: 'French Gold', desc: 'classic french tip with thin gold line, almond nails, bridal' },
  { id: 5, name: 'Emerald Marble', desc: 'emerald green marble with gold veins, squoval nails, luxury' },
  { id: 6, name: 'Nude Gold Line', desc: 'minimal nude base with a single gold line, oval nails' },
  { id: 7, name: 'Bridal Pearl', desc: 'pearl white with subtle shimmer, almond nails, bridal' },
  { id: 8, name: 'Red Chrome', desc: 'bold red chrome metallic, stiletto nails, glamorous' },
  { id: 9, name: 'Silver Frost', desc: 'icy silver chrome frost, square nails, minimal' },
];

const prompt = (d) =>
  `Product photography of a set of five press-on nail tips showing a nail art design, ` +
  `arranged in a neat row from small to large on a clean flat surface, top view flat lay. ` +
  `Design: ${d.desc}. All tips identical style, uniform and symmetrical. ` +
  `NO hand, NO fingers, NO skin — only the nail tips on the surface. ` +
  `Studio lighting, soft neutral background, ultra-high detail, photorealistic, no text, no watermark.`;

function tryRequire(n) { try { return require(n); } catch { return null; } }

async function withGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith('your-')) return false;
  const mod = tryRequire('@google/genai');
  if (!mod) { console.error('❌ @google/genai kurulu değil: npm i @google/genai'); return false; }
  const ai = new mod.GoogleGenAI({ apiKey: key });
  const models = process.env.GEMINI_IMAGE_MODEL
    ? [process.env.GEMINI_IMAGE_MODEL]
    : ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation', 'gemini-2.5-flash-image-preview'];
  console.log('🤖 Gemini ile üretiliyor (ücretsiz)...');
  for (const d of DESIGNS) {
    let done = false;
    for (const model of models) {
      try {
        const res = await ai.models.generateContent({ model, contents: prompt(d), config: { responseModalities: ['IMAGE', 'TEXT'] } });
        const parts = (res?.candidates?.[0]?.content?.parts) || [];
        const b64 = parts.find((p) => p?.inlineData?.data)?.inlineData?.data;
        if (b64) {
          fs.writeFileSync(path.join(OUT, `design-${d.id}.jpg`), Buffer.from(b64, 'base64'));
          console.log(`  ✓ design-${d.id} (${d.name}) [${model}]`);
          done = true; break;
        }
      } catch (e) { /* sıradaki modeli dene */ }
    }
    if (!done) console.warn(`  ✗ design-${d.id} (${d.name}) — üretilemedi`);
  }
  return true;
}

async function withReplicate() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token.startsWith('your-')) return false;
  const Replicate = tryRequire('replicate');
  if (!Replicate) { console.error('❌ replicate kurulu değil: npm i replicate'); return false; }
  const rep = new Replicate({ auth: token });
  console.log('🎨 Flux schnell ile üretiliyor...');
  const https = require('https');
  const dl = (url, dest) => new Promise((res, rej) => {
    https.get(url, (r) => { const f = fs.createWriteStream(dest); r.pipe(f); f.on('finish', () => f.close(res)); }).on('error', rej);
  });
  for (const d of DESIGNS) {
    try {
      const out = await rep.run('black-forest-labs/flux-schnell', { input: { prompt: prompt(d), aspect_ratio: '3:4', output_format: 'jpg' } });
      let url = Array.isArray(out) ? out[0] : out;
      if (url && typeof url.url === 'function') url = url.url();
      await dl(url, path.join(OUT, `design-${d.id}.jpg`));
      console.log(`  ✓ design-${d.id} (${d.name})`);
    } catch (e) { console.warn(`  ✗ design-${d.id} — ${e.message}`); }
  }
  return true;
}

// --- Pollinations (ÜCRETSİZ, anahtarsız) — galeri için birincil yöntem ---
async function withPollinations() {
  const https = require('https');
  const dl = (url, dest) => new Promise((res, rej) => {
    https.get(url, (r) => {
      if ((r.headers['content-type'] || '').startsWith('image')) {
        const f = fs.createWriteStream(dest); r.pipe(f); f.on('finish', () => f.close(res));
      } else { rej(new Error('HTTP ' + r.statusCode)); }
    }).on('error', rej);
  });
  console.log('🌸 Pollinations ile üretiliyor (ücretsiz, anahtarsız)...');
  console.log('   (her görsel 10-30 sn; anonim sınır ~15 sn/görsel — sabırlı ol)');
  for (const d of DESIGNS) {
    try {
      const u = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt(d)) +
        '?width=768&height=1024&nologo=true&model=flux&seed=' + (1000 + d.id);
      await dl(u, path.join(OUT, `design-${d.id}.jpg`));
      console.log(`  ✓ design-${d.id} (${d.name})`);
      await new Promise((r) => setTimeout(r, 16000)); // anonim hız sınırına takılmamak için
    } catch (e) { console.warn(`  ✗ design-${d.id} — ${e.message}`); }
  }
  return true;
}

(async () => {
  console.log('📦 Katalog görselleri üretiliyor →', OUT);
  // Öncelik: ücretsiz Pollinations (galeri için). İstersen anahtarla Gemini/Flux de kullanılabilir.
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('your-')) {
    if (await withGemini()) { console.log('✅ Bitti (Gemini).'); return; }
  }
  if (process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_TOKEN.startsWith('your-')) {
    if (await withReplicate()) { console.log('✅ Bitti (Flux).'); return; }
  }
  await withPollinations();
  console.log('✅ Bitti (Pollinations). public/designs/ dolduruldu.');
})();
