/**
 * ngNailArt — CANLI YÜK TESTİ (senin bilgisayarından çalışır; bulut dış ağa çıkamıyor).
 * 20-30 eşzamanlı "sanal kullanıcı" gibi canlı siteye istek atar ve rapor çıkarır.
 *
 * Kullanım (D:\leman\ngNailArt içinde):
 *   node yuk-testi.js                     -> 30 kullanıcı, 30 sn, admin@demo.com ile login dener
 *   node yuk-testi.js 20 45               -> 20 kullanıcı, 45 sn
 *   node yuk-testi.js 30 30 mail sifre    -> login için farklı hesap
 *
 * Node 18+ gerekir (global fetch). Ek kurulum YOK.
 */
const BASE = process.env.BASE || 'https://miracle-nailart.onrender.com';
const USERS = parseInt(process.argv[2] || '30', 10);
const DURATION = parseInt(process.argv[3] || '30', 10) * 1000;
const LOGIN_EMAIL = process.argv[4] || 'admin@demo.com';
const LOGIN_PW = process.argv[5] || 'Admin123';

const stats = {}; // endpoint -> { lat:[], ok:0, fail:0, codes:{} }
function rec(ep, ms, ok, code) {
  const s = stats[ep] || (stats[ep] = { lat: [], ok: 0, fail: 0, codes: {} });
  s.lat.push(ms);
  ok ? s.ok++ : s.fail++;
  s.codes[code] = (s.codes[code] || 0) + 1;
}
async function hit(ep, opts) {
  const t = Date.now();
  try {
    const r = await fetch(BASE + ep, { ...opts, signal: AbortSignal.timeout(30000) });
    await r.text().catch(() => {});
    rec(ep, Date.now() - t, r.ok, r.status);
  } catch (e) {
    rec(ep, Date.now() - t, false, e.name === 'TimeoutError' ? 'TIMEOUT' : 'ERR');
  }
}
function pct(arr, p) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
}

async function warmup() {
  process.stdout.write('Site uyandırılıyor (soğuk başlangıç)... ');
  const t0 = Date.now();
  for (let i = 0; i < 25; i++) {
    try {
      const r = await fetch(BASE + '/api/health', { signal: AbortSignal.timeout(60000) });
      if (r.ok) { console.log(`hazır — ${((Date.now() - t0) / 1000).toFixed(1)}s`); return Date.now() - t0; }
    } catch { /* bekle */ }
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log('UYARI: health hazır olmadı, yine de devam.');
  return Date.now() - t0;
}

async function worker(deadline) {
  const login = JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PW });
  while (Date.now() < deadline) {
    await hit('/api/health');
    await hit('/api/designs');
    await hit('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: login });
  }
}

(async () => {
  console.log('============================================================');
  console.log('  ngNailArt CANLI YÜK TESTİ');
  console.log('  Hedef   :', BASE);
  console.log('  Kullanıcı:', USERS, ' eşzamanlı  ·  Süre:', DURATION / 1000, 'sn');
  console.log('  Login    :', LOGIN_EMAIL);
  console.log('============================================================');
  const coldMs = await warmup();

  console.log(`\n${USERS} eşzamanlı kullanıcı ${DURATION / 1000} sn boyunca istek atıyor...`);
  const start = Date.now();
  const deadline = start + DURATION;
  await Promise.all(Array.from({ length: USERS }, () => worker(deadline)));
  const wall = (Date.now() - start) / 1000;

  let total = 0, okAll = 0;
  for (const s of Object.values(stats)) { total += s.ok + s.fail; okAll += s.ok; }

  console.log('\n============================================================');
  console.log('  SONUÇ');
  console.log('============================================================');
  console.log(`  Soğuk başlangıç (uyanma) : ${(coldMs / 1000).toFixed(1)} sn`);
  console.log(`  Toplam istek             : ${total}`);
  console.log(`  Başarılı                 : ${okAll}  (%${((okAll / total) * 100).toFixed(1)})`);
  console.log(`  Hatalı                   : ${total - okAll}`);
  console.log(`  Verim (throughput)       : ${(total / wall).toFixed(1)} istek/sn`);
  console.log('  ----------------------------------------------------------');
  console.log('  Uç noktalar (gecikme ms):');
  for (const [ep, s] of Object.entries(stats)) {
    const n = s.lat.length;
    console.log(`   ${ep}`);
    console.log(`      istek=${n}  ok=%${((s.ok / n) * 100).toFixed(1)}  ` +
      `p50=${pct(s.lat, 50)}  p95=${pct(s.lat, 95)}  p99=${pct(s.lat, 99)}  max=${Math.max(...s.lat)}`);
    console.log(`      kodlar: ${JSON.stringify(s.codes)}`);
  }
  console.log('============================================================');
  // Basit yorum
  const errRate = (total - okAll) / total;
  if (errRate > 0.1) console.log('  ⚠ Hata oranı yüksek (>%10) — kapasite/DB bağlantı limiti darboğaz olabilir.');
  else if (pct(stats['/api/designs']?.lat || [0], 95) > 3000) console.log('  ⚠ DB okuma p95 > 3s — Neon uyanma/limit etkisi. Ücretli plan sonrası tekrar ölç.');
  else console.log('  ✓ Bu yük altında site stabil görünüyor.');
  console.log('');
})();
