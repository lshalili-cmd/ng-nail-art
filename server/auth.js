// ngNailArt backend — Kimlik doğrulama (JWT + bcrypt)
// Paketler LAZY: kurulu değilse auth uçları 503 döner, uygulama yine çalışır (guest modu).
//   npm i bcryptjs jsonwebtoken
require('dotenv').config();
const crypto = require('crypto');

function tryRequire(n) { try { return require(n); } catch { return null; } }
const bcrypt = tryRequire('bcryptjs');
const jwt = tryRequire('jsonwebtoken');
const DEFAULT_SECRET = 'ngnail-dev-secret-change-me';
const SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

/** GÜVENLİK: JWT_SECRET tanımsız/varsayılan/çok kısa mı? (üretimde başlatmayı durdurmak için) */
function weakSecret() {
  const s = process.env.JWT_SECRET || '';
  return !s || s === DEFAULT_SECRET || s.length < 16;
}

/**
 * Şifre kuralı — İKİSİNDEN BİRİ geçerli (geriye dönük uyumlu):
 *  (a) ESKİ kural: TAM 1 harf + geri kalanı rakam, en az 6 karakter ("a12345").
 *  (b) GÜÇLÜ şifre: en az 8 karakter, en az 1 harf ve 1 rakam ("Gul2026sifre").
 * Böylece mevcut kullanıcılar etkilenmez ama güvenlik isteyen güçlü şifre seçebilir.
 */
function validPassword(pw) {
  if (typeof pw !== 'string') return false;
  const letters = (pw.match(/[A-Za-z]/g) || []).length;
  const digits = (pw.match(/[0-9]/g) || []).length;
  // (a) eski kural
  if (pw.length >= 6 && letters === 1 && digits === pw.length - 1) return true;
  // (b) güçlü şifre
  if (pw.length >= 8 && letters >= 1 && digits >= 1) return true;
  return false;
}

/** 6 haneli OTP kodu. */
function genOtp() { return String(crypto.randomInt(100000, 1000000)); }
/** Şifre sıfırlama jetonu (URL güvenli). */
function genToken() { return crypto.randomBytes(24).toString('hex'); }

/** Telefonu sadeleştir: rakam ve baştaki + dışında her şeyi at. */
function normPhone(p) {
  if (!p) return '';
  const s = String(p).trim().replace(/[^\d+]/g, '');
  return s;
}

/** Auth paketleri kurulu mu? */
function ready() { return !!(bcrypt && jwt); }

function hash(pw) { return bcrypt.hash(pw, 10); }
function compare(pw, h) { return bcrypt.compare(pw, h); }
function sign(user) { return jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '30d' }); }
function verify(token) { try { return jwt.verify(token, SECRET); } catch { return null; } }

/** İstekten kullanıcı kimliği: YALNIZCA geçerli Bearer token → id, yoksa "guest".
 *  GÜVENLİK: eskiden query/body.userId'ye düşüyordu → token'sız herkes ?userId=<id> ile
 *  başka kullanıcı adına işlem yapabiliyordu (IDOR / hesap ele geçirme). Bu fallback KALDIRILDI. */
function userIdFrom(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const payload = t ? verify(t) : null;
  if (payload && payload.id) return String(payload.id);
  return 'guest';
}

/** Public kullanıcı nesnesi (şifre/otp/jeton hariç). */
function pub(u) {
  return {
    id: u.id, email: u.email, phone: u.phone, firstName: u.firstName, lastName: u.lastName,
    verified: u.verified, plan: u.plan, planSince: u.planSince,
    imagesUsed: u.imagesUsed, imagesExtra: u.imagesExtra, packId: u.packId, packSince: u.packSince,
    role: u.role || 'user',
  };
}

module.exports = { ready, hash, compare, sign, verify, userIdFrom, pub, validPassword, genOtp, genToken, normPhone, weakSecret };
