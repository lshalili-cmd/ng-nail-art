// ngNailArt — Rapor verilerini ŞIK bir HTML tabloya döker (proje kökünde rapor.html).
// Kullanım: rapor-html.bat (çift tık)  ·  ya da:  cd server && node scripts/rapor-html.js
// AKTİF .env veritabanından okur (uygulama tablolarına DOKUNMAZ, sadece okur).
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function fmtDate(v) {
  if (!v) return '';
  try { return new Date(v).toLocaleString('tr-TR'); } catch { return esc(v); }
}
function fmtBool(v, yes, no) { return v ? yes : no; }

function buildTable(title, columns, rows) {
  const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('');
  const body = rows.length
    ? rows.map((r) => '<tr>' + columns.map((c) => `<td>${esc(c.fmt ? c.fmt(r[c.key], r) : r[c.key])}</td>`).join('') + '</tr>').join('')
    : `<tr><td class="empty" colspan="${columns.length}">Kayıt yok</td></tr>`;
  return `
  <section>
    <h2>${esc(title)} <span class="count">${rows.length}</span></h2>
    <div class="tbl-wrap">
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </section>`;
}

(async () => {
  console.log('\n=== HTML rapor hazırlanıyor ===\n');
  try {
    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, phone, "firstName", "lastName", role, verified, plan,
              "imagesUsed", "imagesExtra", "createdAt"
       FROM "User" ORDER BY id DESC`);

    const statuses = await prisma.$queryRawUnsafe(
      `SELECT u.id, u.email,
         CASE WHEN u.role='admin' THEN 'Yönetici' ELSE 'Üye' END AS rol,
         CASE WHEN u.verified THEN 'Doğrulanmış' ELSE 'Doğrulanmamış' END AS dogrulama,
         u.plan,
         CASE
           WHEN u.plan='free' OR u."planSince"=0 THEN 'Ücretsiz'
           WHEN u.plan IN ('monthly','pro') AND to_timestamp(u."planSince"/1000)+interval '30 days'>now() THEN 'Aktif'
           WHEN u.plan IN ('yearly','pro_yearly') AND to_timestamp(u."planSince"/1000)+interval '365 days'>now() THEN 'Aktif'
           ELSE 'Süresi dolmuş'
         END AS plan_durumu,
         u."imagesExtra" AS ek_kredi
       FROM "User" u ORDER BY u.id DESC`);

    const payments = await prisma.$queryRawUnsafe(
      `SELECT o.id, u.email, o."itemName", o.amount, o.currency, o.provider, o."createdAt"
       FROM "Order" o
       LEFT JOIN "User" u ON u.id = CASE WHEN o."userId" ~ '^[0-9]+$' THEN o."userId"::int END
       WHERE o.status='paid' ORDER BY o.id DESC`);

    const blocked = await prisma.$queryRawUnsafe(
      `SELECT id, email, phone,
              to_timestamp(until/1000) AS ban_bitis,
              (until > extract(epoch from now())*1000) AS hala_banli
       FROM "BlockedSignup" ORDER BY until DESC`);

    const sections = [
      buildTable('Kullanıcılar', [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'E-posta' },
        { key: 'phone', label: 'Telefon' },
        { key: 'firstName', label: 'Ad' },
        { key: 'lastName', label: 'Soyad' },
        { key: 'role', label: 'Rol' },
        { key: 'verified', label: 'Doğrulanmış', fmt: (v) => fmtBool(v, 'Evet', 'Hayır') },
        { key: 'plan', label: 'Plan' },
        { key: 'imagesExtra', label: 'Ek Kredi' },
        { key: 'createdAt', label: 'Kayıt', fmt: fmtDate },
      ], users),

      buildTable('Kullanıcı Statusları', [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'E-posta' },
        { key: 'rol', label: 'Rol' },
        { key: 'dogrulama', label: 'Doğrulama' },
        { key: 'plan', label: 'Plan' },
        { key: 'plan_durumu', label: 'Plan Durumu' },
        { key: 'ek_kredi', label: 'Ek Kredi' },
      ], statuses),

      buildTable('Başarılı Ödemeler', [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'E-posta' },
        { key: 'itemName', label: 'Ürün' },
        { key: 'amount', label: 'Tutar' },
        { key: 'currency', label: 'Para Birimi' },
        { key: 'provider', label: 'Sağlayıcı' },
        { key: 'createdAt', label: 'Tarih', fmt: fmtDate },
      ], payments),

      buildTable('Banlı Kullanıcılar', [
        { key: 'id', label: 'ID' },
        { key: 'email', label: 'E-posta' },
        { key: 'phone', label: 'Telefon' },
        { key: 'ban_bitis', label: 'Ban Bitiş', fmt: fmtDate },
        { key: 'hala_banli', label: 'Hâlâ Banlı', fmt: (v) => fmtBool(v, 'Evet', 'Hayır') },
      ], blocked),
    ].join('\n');

    const stamp = new Date().toLocaleString('tr-TR');
    const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ngNailArt — Raporlar</title>
<style>
  :root { --line:#dbe4ec; --head:#eef4f8; --head-ink:#2c5566; --stripe:#dcebf4; --ink:#2b3440; }
  * { box-sizing:border-box; }
  body { margin:0; padding:18px 14px 34px; background:#f6f8fa; color:var(--ink);
         font:12.5px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width:1040px; margin:0 auto; }
  header.top { margin-bottom:14px; }
  header.top h1 { margin:0 0 3px; font-size:18px; color:#b8912e; }
  header.top .sub { color:#6b7684; font-size:11.5px; }
  section { margin:16px 0; background:#fff; border:1px solid var(--line); border-radius:9px;
            overflow:hidden; box-shadow:0 1px 2px rgba(20,40,60,.05); }
  h2 { margin:0; padding:8px 12px; font-size:13px; background:var(--head); color:var(--head-ink);
       border-bottom:1px solid var(--line); display:flex; align-items:center; gap:8px; }
  h2 .count { font-size:11px; font-weight:600; color:#fff; background:#7fa8c0;
              padding:1px 8px; border-radius:999px; }
  .tbl-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { text-align:left; padding:6px 10px; font-weight:700; color:var(--head-ink);
       background:var(--head); border-bottom:2px solid var(--line); white-space:nowrap; }
  td { padding:5px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
  tbody tr:nth-child(even) { background:var(--stripe); }
  tbody tr:hover { background:#cfe3f0; }
  td.empty { text-align:center; color:#8a95a1; font-style:italic; padding:14px; }
  footer { text-align:center; color:#9aa4af; font-size:11px; margin-top:20px; }
</style></head>
<body><div class="wrap">
  <header class="top">
    <h1>💅 ngNailArt — Raporlar</h1>
    <div class="sub">Oluşturulma: ${esc(stamp)} · Kullanıcı: ${users.length} · Ödeme: ${payments.length} · Banlı: ${blocked.length}</div>
  </header>
  ${sections}
  <footer>Bu rapor anlık bir kopyadır. Güncellemek için rapor-html.bat'ı tekrar çalıştır.</footer>
</div></body></html>`;

    const outPath = path.join(__dirname, '..', '..', 'rapor.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('  ✓ Kullanıcılar: ' + users.length);
    console.log('  ✓ Statusler:   ' + statuses.length);
    console.log('  ✓ Ödemeler:    ' + payments.length);
    console.log('  ✓ Banlılar:    ' + blocked.length);
    console.log('\n✓ TAMAM → rapor.html oluşturuldu.\n  ' + outPath + '\n');
  } catch (e) {
    console.error('\n❌ Hata:', e.message);
    console.error('Not: PostgreSQL çalışıyor olmalı ve server/.env postgres olmalı.\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
