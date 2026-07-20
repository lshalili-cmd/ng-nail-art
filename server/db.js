// ngNailArt — Prisma bağlantısı (LAZY + dayanıklı)
// Prisma client üretilmemişse (npm run db:setup yapılmamışsa) prisma=null olur
// ve sunucu yine de çalışır; DB uçları 503 döner.

// --- Neon uyku dayanıklılığı: bağlantı hatasında otomatik yeniden deneme ---
// Neon (ücretsiz plan) ~5 dk boşta veritabanını uyutur; uyandırılırken ilk
// sorgu "Can't reach database server" ile çökebilir. Bu sarmalayıcı, SADECE
// bağlantı hatalarında kısa bekleyip 3 kez tekrar dener → Neon uyanınca giriş
// ve admin gibi işlemler donmadan kendiliğinden açılır. Gerçek hatalar (kayıt
// yok, benzersizlik ihlali vb.) hemen fırlatılır, tekrar denenmez.
const CONN_ERR = /reach database server|closed the connection|can'?t reach|connection (refused|reset|closed|terminated)|ECONNRESET|ECONNREFUSED|ETIMEDOUT|timed out|terminating connection|Connection pool/i;
function isConnErr(e) {
  if (!e) return false;
  if (['P1000', 'P1001', 'P1002', 'P1008', 'P1017'].includes(e.code)) return true;
  return CONN_ERR.test(String(e.message || ''));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withRetry(fn, label) {
  return async (...args) => {
    let lastErr;
    for (let attempt = 0; attempt < 4; attempt++) {
      try { return await fn(...args); }
      catch (e) {
        lastErr = e;
        if (!isConnErr(e)) throw e;                 // gerçek hata → hemen fırlat
        if (attempt < 3) {
          console.warn(`⏳ Veritabanı uykuda olabilir (${label}) — ${attempt + 1}. deneme, uyanması bekleniyor…`);
          await sleep(800 * (attempt + 1));          // 0.8s, 1.6s, 2.4s
        }
      }
    }
    throw lastErr;
  };
}

/** Prisma client'ı bağlantı-dayanıklı hale getirir (model sorgularını withRetry ile sarar). */
function makeResilient(client) {
  const cache = new Map();
  return new Proxy(client, {
    get(target, prop) {
      const val = target[prop];
      // $connect/$transaction/$on gibi dahili üyeler ve semboller: olduğu gibi bırak
      if (typeof prop === 'symbol' || String(prop).startsWith('$') || String(prop).startsWith('_')) {
        return typeof val === 'function' ? val.bind(target) : val;
      }
      // Model erişimi (user, design, favorite…) → sorgu metodlarını retry ile sar
      if (val && typeof val === 'object') {
        if (cache.has(prop)) return cache.get(prop);
        const model = new Proxy(val, {
          get(m, method) {
            const orig = m[method];
            if (typeof orig !== 'function') return orig;
            return withRetry(orig.bind(m), `${String(prop)}.${String(method)}`);
          },
        });
        cache.set(prop, model);
        return model;
      }
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
}

let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = makeResilient(new PrismaClient());
  console.log('🗄️  Prisma bağlı (veritabanı hazır) — bağlantı dayanıklılığı açık');
} catch (e) {
  console.warn('ℹ️  Veritabanı hazır değil — DB uçları 503 döner. Kurmak için: npm run db:setup');
  prisma = null;
}

// SQLite'ta diziler JSON string tutulur — yardımcılar
function parseArr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
  return [];
}
function stringifyArr(v) {
  return JSON.stringify(Array.isArray(v) ? v : []);
}

/** Design kaydını API için diziye çevirir. */
function designOut(d) {
  return {
    ...d,
    colors: parseArr(d.colors),
    shapes: parseArr(d.shapes),
    tones: parseArr(d.tones),
    undertones: parseArr(d.undertones),
    seasons: parseArr(d.seasons),
  };
}

module.exports = { prisma, ready: () => !!prisma, parseArr, stringifyArr, designOut };
