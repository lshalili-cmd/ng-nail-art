// ngNailArt — Prisma bağlantısı (LAZY + dayanıklı)
// Prisma client üretilmemişse (npm run db:setup yapılmamışsa) prisma=null olur
// ve sunucu yine de çalışır; DB uçları 503 döner.

let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('🗄️  Prisma bağlı (veritabanı hazır)');
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
