// ngNailArt backend — Yönetici (Admin) modülü
// - Rol tabanlı koruma (yalnızca role='admin')
// - İstatistik, kullanıcılar, siparişler, tasarımlar, engeller
// - Sistem sağlığı + hata günlüğü (müdahale) + bakım modu
// Tüm uçlar /api/admin/* altında ve requireAdmin ile korumalıdır.

let _db = null;
const RING = [];            // son hatalar (bellekte)
const MAX = 200;
let maintenance = false;

/** Bir hatayı kaydet (bellek + varsa DB). */
function record(level, message, source) {
  try {
    const item = { level, message: String(message).slice(0, 500), source: source || '', createdAt: new Date().toISOString() };
    RING.unshift(item);
    if (RING.length > MAX) RING.pop();
    if (_db && _db.ready && _db.ready()) {
      _db.prisma.errorLog.create({ data: { level, message: item.message, source: item.source } }).catch(() => {});
    }
  } catch { /* logging asla uygulamayı kırmasın */ }
}

/** console.error / console.warn çağrılarını yakala (uygulamadaki tüm loglanan hatalar panele düşer). */
function captureConsole() {
  const oe = console.error, ow = console.warn;
  console.error = function (...a) { record('error', a.map(String).join(' '), 'CONSOLE'); return oe.apply(console, a); };
  console.warn = function (...a) { record('warn', a.map(String).join(' '), 'CONSOLE'); return ow.apply(console, a); };
  process.on('unhandledRejection', (r) => record('error', 'unhandledRejection: ' + ((r && r.message) || r), 'PROCESS'));
  process.on('uncaughtException', (e) => record('error', 'uncaughtException: ' + ((e && e.message) || e), 'PROCESS'));
}

/** Bakım modu geçidi — açıkken admin/auth/health dışındaki API'ler 503 döner. index.js'te ERKEN eklenir. */
function maintenanceGate(req, res, next) {
  if (!maintenance) return next();
  const p = req.path || '';
  if (p.startsWith('/api/admin') || p.startsWith('/api/auth') || p === '/api/health') return next();
  return res.status(503).json({ success: false, error: 'Uygulama bakım modunda', code: 'MAINTENANCE' });
}

/** Tüm /api/admin/* uçlarını app'e bağlar. */
function mount(app, ctx) {
  const { db, auth, ai, payments, sms, mailer } = ctx;
  _db = db;

  async function requireAdmin(req, res, next) {
    try {
      const h = req.headers.authorization || '';
      const t = h.startsWith('Bearer ') ? h.slice(7) : '';
      const payload = t ? auth.verify(t) : null;
      if (!payload || !payload.id) return res.status(401).json({ success: false, error: 'Giriş gerekli', code: 'NO_AUTH' });
      if (!db.ready()) return res.status(503).json({ success: false, error: 'Veritabanı hazır değil', code: 'DB_NOT_READY' });
      const u = await db.prisma.user.findUnique({ where: { id: Number(payload.id) } });
      if (!u || u.role !== 'admin') return res.status(403).json({ success: false, error: 'Yönetici yetkisi gerekli', code: 'NOT_ADMIN' });
      req.adminUser = u;
      next();
    } catch (e) { res.status(500).json({ success: false, error: e.message, code: 'ADMIN_ERROR' }); }
  }
  const fail = (res, e) => res.status(500).json({ success: false, error: e.message, code: 'ADMIN_ERROR' });

  // --- İstatistik ---
  app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
    try {
      const p = db.prisma;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [users, verified, paidUsers, designs, dailyDesigns, orders] = await Promise.all([
        p.user.count(),
        p.user.count({ where: { verified: true } }),
        p.user.count({ where: { NOT: { plan: 'free' } } }),
        p.design.count(),
        p.design.count({ where: { createdAt: { gte: since } } }),
        p.order.findMany({ where: { status: 'paid' } }),
      ]);
      const revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
      res.json({ success: true, data: { users, verified, paidUsers, designs, dailyDesigns, ordersPaid: orders.length, revenue } });
    } catch (e) { fail(res, e); }
  });

  // --- Kullanıcılar ---
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    try {
      const where = q ? { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }] } : {};
      const users = await db.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
      res.json({ success: true, users: users.map((u) => auth.pub(u)) });
    } catch (e) { fail(res, e); }
  });
  app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id); const b = req.body || {}; const data = {};
    if (typeof b.plan === 'string') data.plan = b.plan;
    if (b.imagesExtra != null) data.imagesExtra = Number(b.imagesExtra);
    if (b.imagesUsed != null) data.imagesUsed = Number(b.imagesUsed);
    if (typeof b.verified === 'boolean') data.verified = b.verified;
    if (typeof b.role === 'string' && ['user', 'admin'].includes(b.role)) data.role = b.role;
    try {
      const u = await db.prisma.user.update({ where: { id }, data });
      res.json({ success: true, user: auth.pub(u) });
    } catch (e) { fail(res, e); }
  });
  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (req.adminUser && req.adminUser.id === id) return res.status(400).json({ success: false, error: 'Kendi hesabınızı silemezsiniz', code: 'SELF_DELETE' });
    try { await db.prisma.user.delete({ where: { id } }); res.json({ success: true }); } catch (e) { fail(res, e); }
  });

  // --- Siparişler & gelir ---
  app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
    try {
      const orders = await db.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
      const paid = orders.filter((o) => o.status === 'paid');
      res.json({ success: true, orders, summary: { count: orders.length, paid: paid.length, revenue: paid.reduce((s, o) => s + (o.amount || 0), 0) } });
    } catch (e) { fail(res, e); }
  });

  // --- Tasarımlar ---
  app.get('/api/admin/designs', requireAdmin, async (_req, res) => {
    try {
      const rows = await db.prisma.design.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
      const designs = rows.map((d) => ({ id: d.id, name: d.name, category: d.category, source: d.source, popular: d.popular, rating: d.rating, createdAt: d.createdAt }));
      res.json({ success: true, designs });
    } catch (e) { fail(res, e); }
  });
  app.post('/api/admin/designs/:id/popular', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const d = await db.prisma.design.findUnique({ where: { id } });
      if (!d) return res.status(404).json({ success: false, error: 'Bulunamadı' });
      const upd = await db.prisma.design.update({ where: { id }, data: { popular: !d.popular } });
      res.json({ success: true, popular: upd.popular });
    } catch (e) { fail(res, e); }
  });
  app.delete('/api/admin/designs/:id', requireAdmin, async (req, res) => {
    try { await db.prisma.design.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch (e) { fail(res, e); }
  });

  // --- Engelli kayıtlar (40 gün) ---
  app.get('/api/admin/blocked', requireAdmin, async (_req, res) => {
    try {
      const rows = await db.prisma.blockedSignup.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
      res.json({ success: true, blocked: rows.map((r) => ({ id: r.id, email: r.email, phone: r.phone, until: r.until, createdAt: r.createdAt })) });
    } catch (e) { fail(res, e); }
  });
  app.delete('/api/admin/blocked/:id', requireAdmin, async (req, res) => {
    try { await db.prisma.blockedSignup.delete({ where: { id: Number(req.params.id) } }); res.json({ success: true }); } catch (e) { fail(res, e); }
  });

  // --- Sistem / hatalar / bakım (müdahale) ---
  app.get('/api/admin/errors', requireAdmin, (_req, res) => res.json({ success: true, errors: RING.slice(0, 200) }));
  app.delete('/api/admin/errors', requireAdmin, async (_req, res) => {
    RING.length = 0;
    if (db.ready()) { try { await db.prisma.errorLog.deleteMany({}); } catch { /* geç */ } }
    res.json({ success: true });
  });
  app.get('/api/admin/system', requireAdmin, (_req, res) => {
    let smsProv = 'demo'; try { smsProv = sms.provider ? sms.provider() : (sms.ready() ? 'ready' : 'demo'); } catch { /* geç */ }
    res.json({ success: true, data: {
      db: db.ready(), ai: ai.status(), payments: payments.status(),
      sms: smsProv, mailer: mailer.ready(), maintenance,
      uptime: Math.round(process.uptime()), node: process.version,
    } });
  });
  app.post('/api/admin/maintenance', requireAdmin, (req, res) => {
    maintenance = !!(req.body && req.body.on);
    record('warn', 'Bakım modu ' + (maintenance ? 'AÇILDI' : 'KAPATILDI') + ' (admin)', 'ADMIN');
    res.json({ success: true, maintenance });
  });

  console.log('🛡️  Admin uçları bağlandı (/api/admin/*)');
}

module.exports = { mount, maintenanceGate, captureConsole, record };
