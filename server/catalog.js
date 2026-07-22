// ngNailArt backend — SUNUCU FİYAT/PLAN KATALOĞU (tek doğru kaynak).
// GÜVENLİK: ödeme tutarı ve satın alımın verdiği plan/kredi burada belirlenir.
// İstemciden gelen 'amount' ASLA doğrudan kullanılmaz; buradan doğrulanır.
// (Fiyatlar src/app/core/pricing.ts ile aynı tutulmalı — kur güncellenince ikisi de.)

const DAY = 24 * 60 * 60 * 1000;

/** itemId → para birimi → tutar. */
const PRICES = {
  free:       { USD: 0,      EUR: 0,      GBP: 0,      TRY: 0 },
  monthly:    { USD: 7.85,   EUR: 7.49,   GBP: 6.49,   TRY: 349 },
  yearly:     { USD: 70.65,  EUR: 64.99,  GBP: 54.99,  TRY: 2999 },
  pro:        { USD: 24.99,  EUR: 22.99,  GBP: 19.99,  TRY: 999 },
  pro_yearly: { USD: 224.99, EUR: 209.99, GBP: 179.99, TRY: 8999 },
  pack_10:    { USD: 6,      EUR: 5.99,   GBP: 4.99,   TRY: 249 },
  pack_25:    { USD: 13,     EUR: 12.99,  GBP: 10.99,  TRY: 549 },
  pack_50:    { USD: 25,     EUR: 24.99,  GBP: 19.99,  TRY: 999 },
};

/** itemId → satın alım neyi verir: plan (süreli) veya kredi paketi. */
const GRANTS = {
  monthly:    { kind: 'plan', plan: 'monthly',    days: 30 },
  yearly:     { kind: 'plan', plan: 'yearly',     days: 365 },
  pro:        { kind: 'plan', plan: 'pro',        days: 30 },
  pro_yearly: { kind: 'plan', plan: 'pro_yearly', days: 365 },
  pack_10:    { kind: 'pack', credits: 10 },
  pack_25:    { kind: 'pack', credits: 25 },
  pack_50:    { kind: 'pack', credits: 50 },
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY'];

/** Geçerli itemId mi? */
function isValidItem(itemId) { return Object.prototype.hasOwnProperty.call(PRICES, itemId); }

/** Sunucu fiyatı (tutar). Bilinmeyen ürün/para birimi → null. */
function priceOf(itemId, currency) {
  const cur = CURRENCIES.includes(currency) ? currency : 'USD';
  const row = PRICES[itemId];
  return row ? row[cur] : null;
}

/** Satın alımın verdiği plan/kredi tanımı (yoksa null). */
function grantOf(itemId) { return GRANTS[itemId] || null; }

/**
 * Ödeme onaylandığında kullanıcıya planı/krediyi SUNUCUDA uygular.
 * @returns uygulanan değişiklik tanımı (log için) veya null.
 */
async function applyGrant(prisma, userId, itemId, now) {
  const g = grantOf(itemId);
  if (!g || userId === 'guest') return null;
  const id = Number(userId);
  const ts = now || Date.now();
  if (g.kind === 'plan') {
    await prisma.user.update({ where: { id }, data: { plan: g.plan, planSince: ts } });
    return { plan: g.plan };
  }
  if (g.kind === 'pack') {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    await prisma.user.update({ where: { id }, data: { imagesExtra: (u.imagesExtra || 0) + g.credits, packId: itemId, packSince: ts } });
    return { credits: g.credits };
  }
  return null;
}

module.exports = { PRICES, GRANTS, CURRENCIES, DAY, isValidItem, priceOf, grantOf, applyGrant };
