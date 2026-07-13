// ngNailArt backend — Çok sağlayıcılı ÖDEME (iyzico / Stripe / PayTR)
// SDK'lar/anahtarlar LAZY ve DAYANIKLI: yoksa o sağlayıcı sessizce devre dışı kalır,
// akış "demo" moduna düşer (gerçek para hareketi olmadan tamamlanır).
// Anahtarlar server/.env içine girilince ilgili sağlayıcı otomatik "live" olur.
require('dotenv').config();
const crypto = require('crypto');
const https = require('https');

const PROVIDERS = ['iyzico', 'stripe', 'paytr'];

function tryRequire(name) { try { return require(name); } catch { return null; } }
function realKey(v) { return !!v && !/your-|-here$/i.test(v); }

/** Hangi sağlayıcılar yapılandırılmış (anahtar var)? */
function configured() {
  return {
    iyzico: realKey(process.env.IYZICO_API_KEY) && realKey(process.env.IYZICO_SECRET),
    stripe: realKey(process.env.STRIPE_SECRET_KEY),
    paytr: realKey(process.env.PAYTR_MERCHANT_ID) && realKey(process.env.PAYTR_MERCHANT_KEY) && realKey(process.env.PAYTR_MERCHANT_SALT),
  };
}

function initProviders() {
  const c = configured();
  for (const p of PROVIDERS) {
    if (c[p]) console.log(`💳 Ödeme sağlayıcısı hazır: ${p}`);
  }
  if (!c.iyzico && !c.stripe && !c.paytr) {
    console.warn('⚠️  Ödeme anahtarı yok — ödemeler DEMO modunda çalışır (gerçek tahsilat yok).');
  }
}

/** Durum: sağlayıcı listesi + hazır olanlar + genel mod. */
function status() {
  const c = configured();
  const ready = PROVIDERS.filter((p) => c[p]);
  return {
    providers: PROVIDERS.map((p) => ({ id: p, ready: !!c[p] })),
    anyReady: ready.length > 0,
    mode: ready.length > 0 ? 'live' : 'demo',
  };
}

/**
 * Bir ödeme oturumu başlatır.
 * @returns { mode:'live'|'demo', provider, url?, ref } — live ise url'ye yönlendirilir,
 *          demo ise istemci /api/payments/confirm ile başarıyı simüle eder.
 */
async function createCheckout({ provider, kind, itemId, itemName, amount, currency, userId, buyer, baseUrl }) {
  const c = configured();
  // İstenen sağlayıcı hazırsa onu, değilse ilk hazır olanı, o da yoksa demo'yu kullan
  const chosen = provider && c[provider] ? provider
    : (PROVIDERS.find((p) => c[p]) || provider || 'demo');
  const ref = 'ord_' + crypto.randomBytes(8).toString('hex');

  if (!c[chosen]) {
    return { mode: 'demo', provider: chosen === 'demo' ? (provider || 'demo') : chosen, ref };
  }

  try {
    if (chosen === 'stripe') return await stripeCheckout({ itemName, amount, currency, baseUrl, ref });
    if (chosen === 'iyzico') return await iyzicoCheckout({ itemName, amount, currency, userId, buyer, baseUrl, ref });
    if (chosen === 'paytr') return await paytrCheckout({ itemName, amount, userId, baseUrl, ref });
  } catch (e) {
    // Sağlayıcı YAPILANDIRILMIŞ ama çağrı başarısız → sahte demo YERİNE gerçek hatayı döndür (kullanıcı görsün)
    console.warn(`💳 ${chosen} HATA:`, e.message);
    return { mode: 'error', provider: chosen, ref, error: e.message };
  }
  return { mode: 'demo', provider: chosen, ref };
}

// --- Stripe: Checkout Session ---
async function stripeCheckout({ itemName, amount, currency, baseUrl, ref }) {
  const Stripe = tryRequire('stripe');
  if (!Stripe) throw new Error('stripe paketi kurulu değil (npm i stripe)');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: (currency || 'usd').toLowerCase(),
        product_data: { name: itemName },
        unit_amount: Math.round(Number(amount) * 100),
      },
      quantity: 1,
    }],
    success_url: `${baseUrl}/shop?paid=1&provider=stripe&ref=${ref}`,
    cancel_url: `${baseUrl}/shop?canceled=1`,
    client_reference_id: ref,
  });
  return { mode: 'live', provider: 'stripe', url: session.url, ref: session.id };
}

/**
 * iyzico fiyat formatı: SONDA SIFIR OLMAMALI (ör. "349.00" → "349.0", "6.00" → "6.0"),
 * aksi halde iyzico "Geçersiz imza" döner. Ondalık yoksa ".0" eklenir.
 */
function iyziPrice(amount) {
  let p = parseFloat(amount);
  if (!isFinite(p)) p = 0;
  let s = p.toString();          // 349 → "349", 7.85 → "7.85", 70.65 → "70.65"
  if (s.indexOf('.') === -1) s += '.0';   // tam sayı → "349.0"
  return s;
}

// --- iyzico: Checkout Form Initialize ---
async function iyzicoCheckout({ itemName, amount, currency, userId, buyer, baseUrl, ref }) {
  const Iyzipay = tryRequire('iyzipay');
  if (!Iyzipay) throw new Error('iyzipay paketi kurulu değil (npm i iyzipay)');
  const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY,
    secretKey: process.env.IYZICO_SECRET,
    uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com',
  });
  const price = iyziPrice(amount);
  // Giriş yapmış kullanıcının bilgileri (yoksa misafir değerlerine düşer — iyzico boş alan kabul etmez)
  const bi = buyer || {};
  const name = String(bi.name || '').trim() || 'Musteri';
  const surname = String(bi.surname || '').trim() || 'NailArt';
  const email = String(bi.email || '').trim() || 'musteri@miraclenailart.com';
  const gsm = String(bi.phone || '').trim() || '+905000000000';
  const contact = `${name} ${surname}`.trim();
  console.log(`💳 iyzico istek → fiyat: ${price} ${currency || 'USD'} · ürün: ${itemName}`);
  const request = {
    locale: 'tr', conversationId: ref, price, paidPrice: price,
    currency: currency || 'USD', basketId: ref,
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: `${baseUrl}/shop?paid=1&provider=iyzico&ref=${ref}`,
    buyer: {
      id: String(userId || 'guest'), name, surname, gsmNumber: gsm, identityNumber: '11111111111',
      email, registrationAddress: 'Istanbul, Turkiye', city: 'Istanbul', country: 'Turkey',
      ip: '85.34.78.112',
    },
    billingAddress: { contactName: contact, city: 'Istanbul', country: 'Turkey', address: 'Istanbul, Turkiye' },
    basketItems: [{
      id: itemName, name: itemName, category1: 'Membership', itemType: 'VIRTUAL', price,
    }],
  };
  const result = await new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(request, (err, res) => (err ? reject(err) : resolve(res)));
  });
  if (result.status !== 'success') {
    console.warn('💳 iyzico yanıtı:', JSON.stringify({ status: result.status, errorCode: result.errorCode, errorMessage: result.errorMessage }));
    throw new Error(`iyzico: ${result.errorMessage || 'init hatası'}${result.errorCode ? ' (kod ' + result.errorCode + ')' : ''}`);
  }
  return { mode: 'live', provider: 'iyzico', url: result.paymentPageUrl, ref: result.token || ref };
}

// --- PayTR: get-token (iFrame) ---
async function paytrCheckout({ itemName, amount, userId, baseUrl, ref }) {
  const merchant_id = process.env.PAYTR_MERCHANT_ID;
  const merchant_key = process.env.PAYTR_MERCHANT_KEY;
  const merchant_salt = process.env.PAYTR_MERCHANT_SALT;
  const payment_amount = Math.round(Number(amount) * 100); // kuruş
  const user_ip = '85.34.78.112';
  const email = 'guest@example.com';
  const merchant_oid = ref.replace(/[^a-zA-Z0-9]/g, '');
  const user_basket = Buffer.from(JSON.stringify([[itemName, String(payment_amount), 1]])).toString('base64');
  const no_installment = 1, max_installment = 0, currency = 'TL', test_mode = 1;
  const hashStr = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket +
    no_installment + max_installment + currency + test_mode;
  const paytr_token = crypto.createHmac('sha256', merchant_key).update(hashStr + merchant_salt).digest('base64');
  const params = new URLSearchParams({
    merchant_id, user_ip, merchant_oid, email, payment_amount: String(payment_amount),
    paytr_token, user_basket, debug_on: '1', no_installment: String(no_installment),
    max_installment: String(max_installment), user_name: 'Guest User', user_address: '-',
    user_phone: '05000000000', merchant_ok_url: `${baseUrl}/shop?paid=1&provider=paytr&ref=${ref}`,
    merchant_fail_url: `${baseUrl}/shop?canceled=1`, timeout_limit: '30', currency, test_mode: String(test_mode),
  });
  const body = await httpPost('https://www.paytr.com/odeme/api/get-token', params.toString());
  const json = JSON.parse(body);
  if (json.status !== 'success') throw new Error(json.reason || 'PayTR token hatası');
  return { mode: 'live', provider: 'paytr', url: `https://www.paytr.com/odeme/guvenli/${json.token}`, ref: merchant_oid };
}

function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve(b));
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

module.exports = { initProviders, status, createCheckout, PROVIDERS };
