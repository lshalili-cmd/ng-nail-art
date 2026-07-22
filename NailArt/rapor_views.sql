-- ============================================================
-- ngNailArt - Raporlama View'leri
-- Şema: rapor
-- Açıklama: Kullanıcı, ban, ödeme ve durum raporları için görünümler
-- ============================================================

CREATE SCHEMA IF NOT EXISTS rapor;

-- 1) Üyeler
CREATE OR REPLACE VIEW rapor.kullanicilar AS
SELECT id, email, phone, "firstName", "lastName", role, verified, plan,
       "imagesUsed", "imagesExtra", "createdAt"
FROM "User"
ORDER BY id DESC;

-- 2) Banlılar
CREATE OR REPLACE VIEW rapor.banli_kullanicilar AS
SELECT id, email, phone,
       to_timestamp(until/1000)                              AS ban_bitis,
       (until > extract(epoch from now())*1000)              AS hala_banli,
       "createdAt"                                           AS ban_tarihi
FROM "BlockedSignup"
ORDER BY until DESC;

-- 3) Başarılı ödemeler
CREATE OR REPLACE VIEW rapor.basarili_odemeler AS
SELECT o.id, u.email, o."itemName", o.amount, o.currency, o.provider, o.ref, o."createdAt"
FROM "Order" o
LEFT JOIN "User" u ON u.id = CASE WHEN o."userId" ~ '^\d+$' THEN o."userId"::int END
WHERE o.status = 'paid'
ORDER BY o.id DESC;

-- 4) Kullanıcı durumları (rol, doğrulama, plan durumu, ban)
CREATE OR REPLACE VIEW rapor.kullanici_durumlari AS
SELECT
  u.id,
  u.email,
  CASE WHEN u.role = 'admin' THEN 'Yönetici' ELSE 'Üye' END          AS rol,
  CASE WHEN u.verified THEN 'Doğrulanmış' ELSE 'Doğrulanmamış' END    AS dogrulama,
  u.plan,
  CASE
    WHEN u.plan = 'free' OR u."planSince" = 0 THEN 'Ücretsiz'
    WHEN u.plan IN ('monthly','pro')
         AND to_timestamp(u."planSince"/1000) + interval '30 days'  > now() THEN 'Aktif'
    WHEN u.plan IN ('yearly','pro_yearly')
         AND to_timestamp(u."planSince"/1000) + interval '365 days' > now() THEN 'Aktif'
    ELSE 'Süresi dolmuş'
  END                                                                AS plan_durumu,
  u."imagesExtra"                                                    AS ek_kredi,
  EXISTS (
    SELECT 1 FROM "BlockedSignup" b
    WHERE (b.email = u.email OR b.phone = u.phone)
      AND b.until > extract(epoch from now())*1000
  )                                                                  AS banli_mi,
  u."createdAt"
FROM "User" u
ORDER BY u.id DESC;
