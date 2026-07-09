# Miracle Nail Art AI — ngNailArt

AI destekli **tırnak tasarımı, el/tırnak analizi ve AR deneme** platformu. Angular 18 tek sayfa uygulaması (ön yüz) + Express/Prisma servisi (arka yüz). Mobil-öncelikli, PWA-hazır, siyah + altın lüks tema, 4 dil (TR / EN / RU / AR + otomatik RTL).

> Güncel durum: uygulama uçtan uca çalışır durumda — kayıt/giriş (telefon OTP), üyelik planları ve görsel kotası, çoklu ödeme sağlayıcısı (demo), AI görsel üretimi (anahtar yoksa demo), favoriler, el analizi ve cihazlar arası veri senkronu. Dış servis anahtarı olmadan da hiçbir ekran kırılmaz; ilgili özellik otomatik **demo moduna** düşer.

---

## Hızlı başlangıç (önerilen — tek tık)

Windows'ta, proje klasöründe iki "ajan" hazırdır:

- **`run.bat` — Bekçi.** Çift tıkla. Arka yüzü (port 3000) ve ön yüzü (port 4200) başlatır, **sürekli izler ve biri çökerse saniyeler içinde yeniden başlatır.** Tarayıcı hazır olunca otomatik açılır. Kod her kaydedildiğinde otomatik derlenir ve tarayıcı yenilenir (`--poll`), varsa GitHub'a otomatik push edilir (`auto-git.ps1`).
- **`test.bat` — Test ajanı.** Bir güncelleme yapmadan önce ve sonra çift tıkla. `ng build` (derleme) + `vitest` (birim testler) çalıştırır, sonucu `test-reports/` klasörüne yazar ve **bir önceki çalışmayla karşılaştırıp** "derleme bozuldu mu / test düştü mü" diye rapor verir.

İlk kez kuruluyorsa, arka yüz için bir defalık veritabanı hazırlığı gerekir (aşağıya bakın).

## Elle çalıştırma (klasik yol)

Gereksinim: **Node 18+**.

Ön yüz:

```bash
cd ngNailArt
npm install
npm run dev          # ng serve --poll --live-reload, http://localhost:4200
```

Arka yüz (ayrı bir terminalde):

```bash
cd ngNailArt/server
npm install
npx prisma migrate dev --name init   # ilk sefer: SQLite şemasını oluşturur
npm start                            # http://localhost:3000
```

> Windows PowerShell "npm.ps1 imzalı değil" hatası verirse `npm` yerine `npm.cmd`, `npx` yerine `npx.cmd` kullanın (veya bir kez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`).

Ön yüz `/api` ve `/images` isteklerini `proxy.conf.json` ile arka yüze (`localhost:3000`) yönlendirir; bu yüzden geliştirmede yalnızca `http://localhost:4200` açılır.

Üretim derlemesi:

```bash
npm run build        # çıktı: dist/ng-nail-art
```

---

## Özellikler

- **Ana ekranlar (rotalar):** Ana Sayfa (`/`), Keşfet (`/explore`), Tara (`/scan`), Stüdyo (`/studio`), AR (`/ar`), Mağaza (`/shop`), Profil (`/profile`), Tasarım Detayı (`/design/:id`).
- **AI görsel üretimi:** Stüdyo'da prompt/stil ile tırnak tasarımı üretimi. Sağlayıcı anahtarı yoksa prosedürel **demo görsel** döner; ekran asla boş kalmaz.
- **El & tırnak analizi:** Cilt tonu (CIELAB/ITA), alt ton, parmak uzunluğu ve **tırnak şekli** sınıflandırması (PCA + genişlik profili; tek tırnak yakın çekim dedektörü dahil).
- **Üyelik & görsel kotası:** Ücretsiz / Aylık / Yıllık / Pro / Pro Yıllık planlar. Her plan aylık görsel hakkı verir; üretimde hak düşer, bitince "Paketi Yükselt / Ek Paket Al" uyarısı çıkar. Yükseltme kuralı: aktif plan süresi (30/365 gün) dolmadan aynı plan tekrar alınamaz; yalnızca yükseltilebilir veya ek paket alınabilir.
- **Kimlik doğrulama:** Kayıt (isim, soyisim, benzersiz e-posta **ve** telefon, şifre = tam 1 harf + rakamlar) → **telefon OTP** doğrulaması. Giriş, şifremi unuttum (e-posta bağlantısı), şifre değiştir, hesabı sil. Silinen hesap için **40 gün** aynı e-posta/telefon ile tekrar kayıt engeli.
- **Cihazlar arası senkron:** Giriş yapınca plan ve görsel kotası veritabanından yüklenir; değişiklikler otomatik kaydedilir. Aynı hesapla başka cihazda aynı durum görünür.
- **Favoriler**, **çoklu dil** (TR/EN/RU/AR, seçim kalıcı), **PWA** (yüklenebilir, çevrimdışı kabuk).
- **Çoklu ödeme sağlayıcısı:** iyzico (TR), Stripe (global), PayTR — hepsi soyutlanmış; anahtar yoksa demo tahsilat akışı.

## Teknoloji

**Ön yüz:** Angular 18 (standalone bileşenler, sinyaller, `@if`/`@for`/`@switch`), TypeScript 5.5 strict, HttpClient + fonksiyonel `authInterceptor`, sinyal tabanlı i18n, PWA (manifest + service worker). 

**Arka yüz:** Node/Express, Prisma ORM + SQLite (geliştirme), JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`), OTP/şifre-sıfırlama jetonları. AI/ödeme/SMS/e-posta için "gevşek yükleme + demo yedek" deseni (anahtar yoksa 503 yerine demo).

**Testler:** Vitest (birim), Playwright (uçtan uca).

## Klasör yapısı

```
ngNailArt/
  run.bat / run.ps1          # BEKÇI: her zaman ayakta tutan izleyici
  test.bat / test-agent.ps1  # TEST AJANI: build + test + karşılaştırmalı rapor
  dev.bat / dev.ps1          # tek başına dev sunucusu (bekçinin kullandığı çekirdek)
  auto-git.ps1               # ~90 sn'de bir otomatik commit+push
  proxy.conf.json            # /api, /images -> localhost:3000
  src/app/
    app.routes.ts            # lazy-loaded rotalar
    pages/                   # home, explore, scan, studio, ar, shop, profile, design-detail
    core/
      auth.service.ts        # kayıt/giriş/OTP/şifre/silme + authInterceptor
      plan.service.ts        # plan süresi (30/365 gün) ve durumu
      image-quota.service.ts # görsel hakkı ve ek paket
      sync.service.ts        # giriş/değişiklikte DB ile senkron
      i18n.service.ts        # TR/EN/RU/AR + RTL, kalıcı seçim
      nail-shape-detect.ts   # tırnak şekli (PCA + genişlik profili)
      skin-tone.ts           # CIELAB/ITA cilt tonu
      recommendation.ts      # öneri puanlama
      ai.service.ts / payment.service.ts / favorites.service.ts ...
  server/
    index.js                 # Express + tüm /api uçları
    auth.js  sms.js  mailer.js  payments.js  ai.js  db.js
    prisma/schema.prisma      # Design, Favorite, ScanAnalysis, Order, User, BlockedSignup
```

## Arka yüz API (özet)

Sağlık/AI: `GET /api/health`, `GET /api/ai/status`, `POST /api/ai/chat`, `POST /api/ai/generate-image`.
Tasarım/favori/analiz: `GET|POST /api/designs`, `GET|POST /api/favorites`, `DELETE /api/favorites/:designId`, `POST /api/analysis`, `GET /api/analysis/latest`.
Kimlik: `POST /api/auth/register | verify-otp | resend-otp | login | forgot | reset | change-password | delete-account`, `GET /api/auth/me`, `PUT /api/auth/state`.
Ödeme: `GET /api/payments/status`, `POST /api/payments/checkout | confirm`.

## Ortam değişkenleri (isteğe bağlı)

Hiçbiri zorunlu değildir; yoksa ilgili özellik demo moduna düşer. `server/.env`:

- **AI:** OpenAI / Gemini / Replicate anahtarları (yoksa demo görsel).
- **Ödeme:** iyzico / Stripe / PayTR anahtarları (yoksa demo tahsilat).
- **SMS (OTP):** Twilio veya Netgsm (yoksa OTP yanıtta/konsolda döner).
- **E-posta:** SMTP (yoksa şifre-sıfırlama bağlantısı yanıtta döner).
- `DATABASE_URL` (SQLite dosya yolu), `JWT_SECRET`.

## Testler

```bash
npm test                # birim testler (vitest, src/**/*.spec.ts)
npm run test:watch      # izleme modu
npm run e2e:install     # ilk sefer: Playwright Chromium
npm run e2e             # uçtan uca duman testleri
```

Birim testler saf mantığı kapsar: cilt tonu (`skin-tone`), öneri puanlama (`recommendation`), tırnak şekli (`nail-shape-detect`). `.spec.ts` dosyaları `ng build`'e dahil değildir (`tsconfig.app.json` yalnızca `main.ts` grafiğini derler), bu yüzden dev sunucusunu/derlemeyi etkilemez.

Gündelik kullanımda **`test.bat`** (test ajanı) bunların üstüne derleme kontrolü + önceki çalışmayla karşılaştırma ekler.

## Yol haritası (kalan)

- **Canlı yayına alma (deploy):** ön yüz + arka yüz + veritabanını herkese açık bir adrese taşımak (bilgisayar kapalıyken de erişim).
- Üretim veritabanı olarak SQLite → Postgres geçişi (deploy ile birlikte).
- Gerçek AI/ödeme/SMS anahtarlarının canlı ortamda bağlanması.

## İlgili belgeler

- `ADR.md` — mimari kararlar ve gerekçeleri.
- `IMPLEMENTASYON.md` — özellik implementasyon dökümü.
- `OTOMATIK-GUNCELLEME.md` — otomatik derleme/yenileme/push akışı.
- `CLAUDE.md` — proje çalışma kuralları.
