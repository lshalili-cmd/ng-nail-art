/**
 * ngNailArt — OTOMATIK API TEST CALISTIRICISI (yerel, guvenli).
 * Backend calisiyor olmali (yerel-pg-baslat.bat). YALNIZCA localhost'a baglanir.
 * Kendi test kullanicilarini olusturur ve SONUNDA siler (demo silme akisiyla).
 * Kullanim:  node test-calistir.js
 */
const BASE = process.env.BASE || 'http://localhost:3000';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(BASE)) {
  console.error('GUVENLIK: Sadece localhost hedefine izin var. Iptal.');
  process.exit(1);
}

const R = [];
function log(group, name, expected, actual, passBool, opts = {}) {
  R.push({ group, name, expected, actual: String(actual), status: passBool === null ? 'TEST EDILEMEDI' : (passBool ? 'BASARILI' : 'BASARISIZ'),
    code: opts.code || '', endpoint: opts.endpoint || '', sev: opts.sev || 'Orta', fix: opts.fix || '' });
}
async function api(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  let status = 0, json = null, err = '';
  try {
    const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
    status = r.status; try { json = await r.json(); } catch { /* metin */ }
  } catch (e) { err = e.message; }
  return { status, json, err };
}
const uniq = Date.now();
const email = (n) => `qatest_${uniq}_${n}@local.test`;
const PW = 'a12345', PW2 = 'b67890';

async function makeUser(n, { first = 'Test', last = 'User', phone } = {}) {
  const em = email(n);
  const ph = phone || `+90555${String(uniq).slice(-7)}${n}`;
  const reg = await api('POST', '/api/auth/register', { body: { firstName: first, lastName: last, email: em, phone: ph, password: PW } });
  const otp = reg.json && reg.json.demoOtp;
  if (!otp) return { email: em, phone: ph, token: null, reg, verifyErr: 'demoOtp yok' };
  const v = await api('POST', '/api/auth/verify-otp', { body: { email: em, code: otp } });
  return { email: em, phone: ph, token: v.json && v.json.token, id: v.json && v.json.user && v.json.user.id, reg, otp, pw: PW };
}
async function cleanup(u) {
  if (!u || !u.email) return;
  try {
    const d = await api('POST', '/api/auth/delete-account', { token: u.token, body: { email: u.email, phone: u.phone, password: u.pw || PW } });
    const link = d.json && d.json.demoLink;
    if (link) { const tok = link.split('delete=')[1]; if (tok) await api('POST', '/api/auth/confirm-delete', { body: { token: tok } }); }
  } catch { /* best effort */ }
}

(async () => {
  console.log('ngNailArt otomatik test — hedef:', BASE);
  const health = await api('GET', '/api/health');
  if (health.status !== 200) { console.error('Backend calismiyor (health != 200).'); process.exit(1); }
  log('A', 'Health endpoint', '200 healthy', health.status, health.status === 200, { endpoint: '/api/health', sev: 'Dusuk' });
  const designs = await api('GET', '/api/designs');
  log('A', 'Tasarim listesi', '200 + designs[]', `${designs.status} (${designs.json && designs.json.count})`, designs.status === 200, { endpoint: '/api/designs', sev: 'Dusuk' });

  // Admin token'i erken al (odeme dogrulamasi ve J icin)
  const adminLogin = await api('POST', '/api/auth/login', { body: { email: 'admin@demo.com', password: 'Admin123' } });
  const adminToken = adminLogin.json && adminLogin.json.token;

  // ---- C) KAYIT ----
  const main = await makeUser(1, { first: 'Şeyma', last: 'Öztürk' });
  log('C', 'Gecerli kayit + OTP', 'needOtp + demoOtp', main.token ? 'kayit+dogrulama OK' : (main.verifyErr || 'basarisiz'), !!main.token, { endpoint: '/api/auth/register', sev: 'Kritik' });
  log('C', 'Turkce ad-soyad', 'Şeyma Öztürk bozulmadan', (main.reg && main.reg.status) === 200 ? 'kabul' : 'red', (main.reg && main.reg.status) === 200, { endpoint: '/api/auth/register', sev: 'Orta' });
  const dup = await api('POST', '/api/auth/register', { body: { firstName: 'X', lastName: 'Y', email: main.email, phone: main.phone, password: PW } });
  log('C', 'Ayni e-posta ikinci kayit', '409 EMAIL_TAKEN', `${dup.status} ${dup.json && dup.json.code}`, dup.status === 409, { endpoint: '/api/auth/register', sev: 'Yuksek' });
  const noMail = await api('POST', '/api/auth/register', { body: { firstName: 'X', lastName: 'Y', phone: '+905551112233', password: PW } });
  log('C', 'Bos e-posta', '400', noMail.status, noMail.status === 400, { endpoint: '/api/auth/register' });
  const badMail = await api('POST', '/api/auth/register', { body: { firstName: 'X', lastName: 'Y', email: 'bozukmail', phone: '+905551112244', password: PW } });
  log('C', 'Gecersiz e-posta formati', '400 BAD_EMAIL', `${badMail.status} ${badMail.json && badMail.json.code}`, badMail.status === 400, { endpoint: '/api/auth/register' });
  const shortPw = await api('POST', '/api/auth/register', { body: { firstName: 'X', lastName: 'Y', email: email('sp'), phone: '+905551112255', password: 'a1' } });
  log('C', 'Cok kisa sifre', '400 BAD_PASSWORD', `${shortPw.status} ${shortPw.json && shortPw.json.code}`, shortPw.status === 400, { endpoint: '/api/auth/register' });
  const digitsPw = await api('POST', '/api/auth/register', { body: { firstName: 'X', lastName: 'Y', email: email('dp'), phone: '+905551112266', password: '123456' } });
  log('C', 'Sadece rakam sifre', '400 BAD_PASSWORD', `${digitsPw.status} ${digitsPw.json && digitsPw.json.code}`, digitsPw.status === 400, { endpoint: '/api/auth/register' });

  // ---- D) GIRIS ----
  const l1 = await api('POST', '/api/auth/login', { body: { email: main.email, password: PW } });
  log('D', 'Dogru bilgiyle giris', '200 + token', `${l1.status}`, l1.status === 200 && !!(l1.json && l1.json.token), { endpoint: '/api/auth/login', sev: 'Kritik' });
  const l2 = await api('POST', '/api/auth/login', { body: { email: main.email, password: 'z99999' } });
  log('D', 'Yanlis sifre', '401', `${l2.status}`, l2.status === 401, { endpoint: '/api/auth/login' });
  const l3 = await api('POST', '/api/auth/login', { body: { email: 'yokboyle@local.test', password: PW } });
  log('D', 'Kayitsiz e-posta', '401', `${l3.status}`, l3.status === 401, { endpoint: '/api/auth/login' });
  const same = l2.json && l3.json && l2.json.error === l3.json.error;
  log('D', 'Hata mesaji hesap ifsa etmiyor', 'ayni mesaj', same ? 'ayni' : 'FARKLI', !!same, { endpoint: '/api/auth/login', sev: 'Orta' });
  const lCase = await api('POST', '/api/auth/login', { body: { email: main.email.toUpperCase(), password: PW } });
  log('D', 'Buyuk harfli e-posta', '200', `${lCase.status}`, lCase.status === 200, { endpoint: '/api/auth/login' });

  // ---- E) SIFRE ----
  const cpNoAuth = await api('POST', '/api/auth/change-password', { body: { password: PW2 } });
  log('E', 'Token olmadan sifre degistir', '401', `${cpNoAuth.status}`, cpNoAuth.status === 401, { endpoint: '/api/auth/change-password', sev: 'Yuksek' });

  // ---- K) GUVENLIK ----
  const meNoAuth = await api('GET', '/api/auth/me');
  log('K', 'Token olmadan /me', '401', `${meNoAuth.status}`, meNoAuth.status === 401, { endpoint: '/api/auth/me', sev: 'Yuksek' });
  const adminNoAuth = await api('GET', '/api/admin/stats');
  log('K', 'Token olmadan admin', '401', `${adminNoAuth.status}`, adminNoAuth.status === 401, { endpoint: '/api/admin/stats', sev: 'Yuksek' });
  const sqli = await api('POST', '/api/auth/login', { body: { email: "' OR '1'='1", password: 'x' } });
  log('K', 'SQL injection denemesi (login)', '401', `${sqli.status}`, sqli.status === 401, { endpoint: '/api/auth/login', sev: 'Yuksek' });

  const victim = await makeUser(2);
  if (victim.id) {
    const meIdor = await api('GET', `/api/auth/me?userId=${victim.id}`);
    const leaked = meIdor.status === 200 && meIdor.json && meIdor.json.user && meIdor.json.user.email === victim.email;
    log('K', 'IDOR: ?userId ile baska profili oku', 'reddedilmeli (401)', leaked ? `SIZDI: ${victim.email}` : `${meIdor.status}`, !leaked,
      { endpoint: '/api/auth/me?userId=', sev: 'Kritik', fix: 'userIdFrom fallback kaldirildi' });
    const cpIdor = await api('POST', `/api/auth/change-password?userId=${victim.id}`, { body: { password: PW2 } });
    let taken = false;
    if (cpIdor.status === 200) { const lv = await api('POST', '/api/auth/login', { body: { email: victim.email, password: PW2 } }); taken = lv.status === 200; }
    log('K', 'IDOR: ?userId ile sifre degistir', 'reddedilmeli (401)', taken ? 'HESAP ELE GECIRILDI' : `${cpIdor.status}`, !taken,
      { endpoint: '/api/auth/change-password?userId=', sev: 'Kritik', fix: 'userIdFrom fallback kaldirildi' });
    victim.pw = taken ? PW2 : PW;
  }

  // ---- H) PLAN/KOTA suistimali ----
  if (main.token) {
    const st = await api('PUT', '/api/auth/state', { token: main.token, body: { plan: 'pro', imagesUsed: 0, imagesExtra: 999 } });
    const me = await api('GET', '/api/auth/me', { token: main.token });
    const planNow = me.json && me.json.user && me.json.user.plan;
    const extraNow = me.json && me.json.user && me.json.user.imagesExtra;
    const abused = planNow === 'pro' || extraNow >= 999;
    log('H', 'Kullanici kendini pro/999-kredi yapabiliyor mu', 'reddedilmeli', abused ? `PRO/kredi: plan=${planNow} extra=${extraNow}` : `plan=${planNow} extra=${extraNow}`, !abused,
      { endpoint: '/api/auth/state', sev: 'Kritik', fix: 'state plan/paket/kredi-artisini client\'tan almaz' });
  }

  // ---- I) ODEME (tutar + mesru satin alim) ----
  const coBad = await api('POST', '/api/payments/checkout', { body: { itemId: 'gecersiz_urun' } });
  log('I', 'Gecersiz urun ile checkout', '400', `${coBad.status} ${coBad.json && coBad.json.code}`, coBad.status === 400, { endpoint: '/api/payments/checkout' });

  // Tutar manipulasyonu: amount=1 gonder, sunucunun KAYDETTIGI tutari admin'den dogrula
  const coManip = await api('POST', '/api/payments/checkout', { token: main.token, body: { itemId: 'pro_yearly', amount: 1, currency: 'TRY' } });
  let storedAmount = null;
  const manipRef = coManip.json && coManip.json.data && coManip.json.data.ref;
  if (adminToken && manipRef) {
    const ord = await api('GET', '/api/admin/orders', { token: adminToken });
    const found = ord.json && ord.json.orders && ord.json.orders.find((o) => o.ref === manipRef);
    storedAmount = found ? found.amount : null;
  }
  const chargedReal = storedAmount != null && storedAmount !== 1;   // sunucu gercek fiyati kullandi
  log('I', 'Tutar manipulasyonu (amount=1)', 'sunucu gercek fiyati (2999) kullanmali, 1 degil', storedAmount === null ? 'siparis okunamadi' : `kayitli tutar=${storedAmount}`, chargedReal,
    { endpoint: '/api/payments/checkout', sev: 'Yuksek', fix: 'Tutar sunucu katalogundan' });

  // Mesru satin alim: pack_10 al + onayla -> sunucu 10 kredi vermeli
  if (main.token) {
    const buy = await api('POST', '/api/payments/checkout', { token: main.token, body: { itemId: 'pack_10', currency: 'TRY' } });
    const buyRef = buy.json && buy.json.data && buy.json.data.ref;
    if (buyRef) await api('POST', '/api/payments/confirm', { token: main.token, body: { ref: buyRef } });
    const me1 = await api('GET', '/api/auth/me', { token: main.token });
    const extra1 = me1.json && me1.json.user && me1.json.user.imagesExtra;
    log('I', 'Odeme sonrasi kredi SUNUCUDA verildi (pack_10)', 'imagesExtra=10', `imagesExtra=${extra1}`, extra1 === 10, { endpoint: '/api/payments/confirm', sev: 'Yuksek' });
    // Ikinci confirm (cift callback) -> kredi TEKRAR eklenmemeli (idempotency)
    if (buyRef) await api('POST', '/api/payments/confirm', { token: main.token, body: { ref: buyRef } });
    const me2 = await api('GET', '/api/auth/me', { token: main.token });
    const extra2 = me2.json && me2.json.user && me2.json.user.imagesExtra;
    log('I', 'Cift onay (idempotency)', 'kredi hala 10 (iki katina cikmaz)', `imagesExtra=${extra2}`, extra2 === 10, { endpoint: '/api/payments/confirm', sev: 'Yuksek' });
  }

  // ---- J) ADMIN ----
  log('J', 'Admin giris', '200 role=admin', adminToken ? `role=${adminLogin.json.user.role}` : `${adminLogin.status}`, !!adminToken && adminLogin.json.user.role === 'admin', { endpoint: '/api/auth/login' });
  if (main.token) {
    const asUser = await api('GET', '/api/admin/stats', { token: main.token });
    log('J', 'Normal kullanici admin uca', '403 NOT_ADMIN', `${asUser.status} ${asUser.json && asUser.json.code}`, asUser.status === 403, { endpoint: '/api/admin/stats', sev: 'Yuksek' });
  }
  if (adminToken) {
    const st = await api('GET', '/api/admin/stats', { token: adminToken });
    log('J', 'Admin istatistik', '200', `${st.status}`, st.status === 200, { endpoint: '/api/admin/stats' });
  }

  await cleanup(main); await cleanup(victim);

  console.log('\n================= TEST RAPORU =================');
  const bySev = { Kritik: 0, Yuksek: 0, Orta: 0, Dusuk: 0 };
  let ok = 0, faildCount = 0, na = 0;
  for (const r of R) {
    if (r.status === 'BASARILI') ok++; else if (r.status === 'BASARISIZ') { faildCount++; bySev[r.sev] = (bySev[r.sev] || 0) + 1; } else na++;
    const mark = r.status === 'BASARILI' ? 'OK ' : r.status === 'BASARISIZ' ? 'XX ' : '.. ';
    console.log(`${mark}[${r.group}] ${r.name}`);
    console.log(`      beklenen: ${r.expected} | gerceklesen: ${r.actual} | ${r.endpoint}`);
    if (r.status === 'BASARISIZ') console.log(`      >>> ONEM: ${r.sev}${r.fix ? ' | COZUM: ' + r.fix : ''}`);
  }
  console.log('\n--------------- OZET ---------------');
  console.log(`Toplam: ${R.length} | Basarili: ${ok} | Basarisiz: ${faildCount} | Test edilemedi: ${na}`);
  console.log(`Basarisizlar onem: Kritik ${bySev.Kritik || 0} · Yuksek ${bySev.Yuksek || 0} · Orta ${bySev.Orta || 0} · Dusuk ${bySev.Dusuk || 0}`);
  console.log('Test kullanicilari temizlendi (qatest_*@local.test).');
  console.log('====================================');
})();
