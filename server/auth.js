// ngNailArt backend — Kimlik doğrulama (JWT + bcrypt)
// Paketler LAZY: kurulu değilse auth uçları 503 döner, uygulama yine çalışır (guest modu).
//   npm i bcryptjs jsonwebtoken
require('dotenv').config();

function tryRequire(n) { try { return require(n); } catch { return null; } }
const bcrypt = tryRequire('bcryptjs');
const jwt = tryRequire('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'ngnail-dev-secret-change-me';

/** Auth paketleri kurulu mu? */
function ready() { return !!(bcrypt && jwt); }

function hash(pw) { return bcrypt.hash(pw, 10); }
function compare(pw, h) { return bcrypt.compare(pw, h); }
function sign(user) { return jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '30d' }); }
function verify(token) { try { return jwt.verify(token, SECRET); } catch { return null; } }

/** İstekten kullanıcı kimliği: geçerli Bearer token → id, yoksa body/query.userId, o da yoksa "guest". */
function userIdFrom(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const payload = t ? verify(t) : null;
  if (payload && payload.id) return String(payload.id);
  return (req.query && req.query.userId) || (req.body && req.body.userId) || 'guest';
}

/** Public kullanıcı nesnesi (şifre hariç). */
function pub(u) {
  return {
    id: u.id, email: u.email, plan: u.plan, planSince: u.planSince,
    imagesUsed: u.imagesUsed, imagesExtra: u.imagesExtra, packId: u.packId, packSince: u.packSince,
  };
}

module.exports = { ready, hash, compare, sign, verify, userIdFrom, pub };
