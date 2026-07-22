// ngNailArt — rapor şemasını ve 4 raporu (TABLO) AKTİF .env veritabanına kurar.
// Kullanım: rapor-kur.bat (çift tık)  ·  ya da:  cd server && node scripts/rapor-kur.js
// Var olan rapor şemasını silip tazeden kurar. Tablolar ANLIK kopyadır; güncel veri
// için dosyayı tekrar çalıştır. (Uygulama tablolarına dokunmaz — sadece rapor şeması.)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const steps = [
  ['eski rapor şeması siliniyor', 'DROP SCHEMA IF EXISTS rapor CASCADE'],
  ['rapor şeması oluşturuluyor', 'CREATE SCHEMA rapor'],
  ['kullanicilar', `CREATE TABLE rapor.kullanicilar AS
     SELECT id, email, phone, "firstName", "lastName", role, verified, plan,
            "imagesUsed", "imagesExtra", "createdAt"
     FROM "User"`],
  ['banli_kullanicilar', `CREATE TABLE rapor.banli_kullanicilar AS
     SELECT id, email, phone,
            to_timestamp(until/1000)                 AS ban_bitis,
            (until > extract(epoch from now())*1000) AS hala_banli,
            "createdAt"                              AS ban_tarihi
     FROM "BlockedSignup"`],
  ['basarili_odemeler', `CREATE TABLE rapor.basarili_odemeler AS
     SELECT o.id, u.email, o."itemName", o.amount, o.currency, o.provider, o.ref, o."createdAt"
     FROM "Order" o
     LEFT JOIN "User" u ON u.id = CASE WHEN o."userId" ~ '^[0-9]+$' THEN o."userId"::int END
     WHERE o.status = 'paid'`],
  ['kullanici_durumlari', `CREATE TABLE rapor.kullanici_durumlari AS
     SELECT u.id, u.email,
       CASE WHEN u.role = 'admin' THEN 'Yönetici' ELSE 'Üye' END       AS rol,
       CASE WHEN u.verified THEN 'Doğrulanmış' ELSE 'Doğrulanmamış' END AS dogrulama,
       u.plan,
       CASE
         WHEN u.plan = 'free' OR u."planSince" = 0 THEN 'Ücretsiz'
         WHEN u.plan IN ('monthly','pro')
              AND to_timestamp(u."planSince"/1000) + interval '30 days'  > now() THEN 'Aktif'
         WHEN u.plan IN ('yearly','pro_yearly')
              AND to_timestamp(u."planSince"/1000) + interval '365 days' > now() THEN 'Aktif'
         ELSE 'Süresi dolmuş'
       END                                                             AS plan_durumu,
       u."imagesExtra"                                                 AS ek_kredi,
       u."createdAt"
     FROM "User" u`],
];

(async () => {
  console.log('\n=== rapor şeması kuruluyor ===\n');
  try {
    for (const [name, sql] of steps) {
      await prisma.$executeRawUnsafe(sql);
      console.log('  ✓ ' + name);
    }
    console.log('\n✓ TAMAM — rapor şeması + 4 TABLO oluşturuldu (anlık kopya).');
    console.log('  pgAdmin4: Schemas → rapor → Tables (sağ tık → Refresh).');
    console.log('  Güncel veri için bu dosyayı tekrar çalıştır (tazeler).\n');
  } catch (e) {
    console.error('\n❌ Hata:', e.message);
    console.error('Not: PostgreSQL çalışıyor olmalı ve server/.env DATABASE_URL postgres olmalı.\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
