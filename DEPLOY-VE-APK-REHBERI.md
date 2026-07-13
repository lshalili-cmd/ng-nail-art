# Miracle Nail Art — Yayına Alma (Deploy) ve APK Rehberi

Bu rehber, uygulamayı internete açmanı (deploy) ve Android APK üretmeni adım adım anlatır.
Kod tarafı hazır: **backend artık derlenmiş Angular arayüzünü de sunuyor**, yani tek servisle yayına alınır.

---

## 0. Mimari (nasıl çalışıyor)

```
Telefon / Tarayıcı  →  Tek Sunucu (Render)  →  Veritabanı
                       ├─ /api/*  (backend)
                       └─ /       (Angular arayüz)
```

Backend (`server/index.js`) hem `/api` uçlarını hem de derlenmiş Angular'ı (`dist/ng-nail-art/browser`) sunar. Böylece ayrı ön yüz sunucusu gerekmez ve `/api` göreli adresi her yerde çalışır.

---

## 1. Önce yerelde "üretim" testi (isteğe bağlı ama önerilir)

Bilgisayarında canlı ortamı taklit et:

```
npm install
npm run build           # Angular'ı dist/ klasörüne derler
cd server
npm install
npx prisma generate
npx prisma db push
node index.js
```

Sonra tarayıcıda **http://localhost:3000** (4200 değil!) aç. Backend hem arayüzü hem API'yi sunar. Açılışta logda `🖥️ Angular arayüzü sunuluyor (üretim modu)` görürsün. Çalışıyorsa deploy'a hazırsın.

---

## 2. Render'a yayına alma (en kolay yol)

### 2.1. Hazırlık
- Kodu bir **GitHub deposuna** yükle (Render depodan çeker).
- Ücretsiz bir **Render.com** hesabı aç.

### 2.2. Deploy
Repoda hazır bir **`render.yaml`** var. Render'da:
1. **New +  →  Blueprint** seç, GitHub deponu bağla.
2. Render `render.yaml`'ı okuyup servisi otomatik kurar (derleme + başlatma komutları hazır).
3. **Environment (ortam değişkenleri)** kısmında `sync: false` olan anahtarları elle gir:
   - `IYZICO_API_KEY`, `IYZICO_SECRET` (ödeme için)
   - `REPLICATE_API_TOKEN` (gerçek AI için — yoksa demo)
   - İstersen `SMTP_*`, `TWILIO_*` (yoksa demo)
   - `JWT_SECRET` otomatik üretilir.
4. **Create / Deploy** de. Birkaç dakikada `https://<adin>.onrender.com` adresin hazır olur.

### 2.3. Yayın sonrası
- `IYZICO_URI`'yi canlıya alırken `https://api.iyzipay.com` yap (sandbox yerine).
- `APP_URL`'yi kendi Render adresinle ayarla (ödeme dönüşü/e-posta linkleri doğru olsun).

> **Ücretsiz plan notları:** Render ücretsiz web servisi ~15 dk hareketsizlikte uykuya geçer (ilk istek yavaş açılır). SQLite dosyası ücretsiz planda **kalıcı değildir** — her yeniden dağıtımda sıfırlanır (admin/tasarımlar otomatik yeniden oluşur). Gerçek kullanıcı verisi için PostgreSQL'e geç (aşağı bak).

---

## 3. PostgreSQL'e geçiş (kalıcı veri — gerçek yayın)

SQLite hızlı test için iyidir ama kalıcı değildir. Gerçek kullanıcılar için:

1. Ücretsiz bir PostgreSQL al: **Neon** (neon.tech — kalıcı ücretsiz katman, önerilir) veya Render PostgreSQL. `postgresql://...` bağlantı adresini kopyala.
2. `server/prisma/schema.prisma` içinde:
   ```prisma
   datasource db {
     provider = "postgresql"   // "sqlite" idi
     url      = env("DATABASE_URL")
   }
   ```
3. `DATABASE_URL`'yi (Render panelinde veya `.env`) o postgres adresiyle değiştir.
4. Şemayı kur: `cd server && npx prisma db push`
5. Yeniden başlat/dağıt. Bitti — veriler artık kalıcı.

> Not: Prisma'da `provider` sabittir (ortam değişkeni olamaz). Postgres'e geçince **yerel geliştirme de** Postgres kullanmalı (aynı bulut adresini dev için de kullanabilir ya da bilgisayarına yerel Postgres kurabilirsin).

---

## 4. Android APK üretme

APK, deploy'dan **sonra** yapılır (uygulama canlı adrese bağlanır).

### 4.1. Capacitor'ı canlı adrese bağla
`capacitor.config.ts` içinde `server.url`'yi aç ve kendi Render adresini yaz:
```ts
server: {
  androidScheme: 'https',
  url: 'https://<adin>.onrender.com',   // kendi canlı adresin
},
```
Böylece APK her açılışta canlı siteyi yükler (güncelleme için APK'yı yeniden yayınlaman gerekmez).

### 4.2. APK'yı derle (bilgisayarında)
Gereken: **Android Studio** kurulu olmalı.
```
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android
npm run build
npx cap add android
npx cap sync
npx cap open android
```
Android Studio açılınca: **Build  →  Generate Signed Bundle / APK  →  APK** ile imzalı APK'yı üret. Bu dosyayı test cihazına kurabilir veya Google Play'e yükleyebilirsin.

### 4.3. İzinler
Kamera (AR/tarama) için Android izinleri Capacitor tarafından otomatik eklenir; ilk kullanımda kullanıcıdan kamera izni istenir.

---

## 5. Yayın öncesi kısa kontrol listesi

- [ ] `npm run build` yerelde hatasız derleniyor
- [ ] http://localhost:3000 (üretim testi) çalışıyor
- [ ] Kod GitHub'da
- [ ] Render Blueprint ile deploy edildi, `https://...onrender.com` açılıyor
- [ ] Anahtarlar (iyzico, varsa Replicate/SMTP) Render'a girildi
- [ ] `APP_URL` ve (canlıda) `IYZICO_URI` ayarlandı
- [ ] Gerçek yayın için PostgreSQL'e geçildi
- [ ] (Mobil) `capacitor.config.ts` canlı adrese bağlandı, APK üretildi
- [ ] Gizlilik/KVKK/Şartlar metinleri avukat onayından geçti (uygulamada hazır)

---

Sorularında hangi adımda takıldığını söyle; o adımı birlikte yürütürüz.
