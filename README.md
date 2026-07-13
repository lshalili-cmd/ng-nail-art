# Miracle Nail Art AI (ngNailArt)

Yapay zekâ destekli tırnak tasarımı uygulaması. Kullanıcı elini kamerayla taratır, analiz sonucuna göre
kendisine özel tırnak tasarımı üretilir, tasarımı **AR ile canlı** kendi tırnağında dener, beğenir,
kaydeder ve satın alabilir.

Güncelleme: 10 Temmuz 2026

---

## Teknoloji

**Ön yüz:** Angular 18 (standalone bileşenler, signals, yeni kontrol akışı `@if/@for`), TypeScript strict,
mobil-öncelikli. PWA (manifest + service worker), APK'ya hazır (Capacitor / PWABuilder).

**Arka uç:** Node.js + Express, Prisma ORM. Geliştirmede **SQLite**; yayına çıkışta **PostgreSQL**
(Prisma ile tek satır değişiklik). Kimlik: JWT + bcrypt.

**Yapay zekâ / görsel:**
- **El analizi:** MediaPipe (tarayıcıda, cihaz-üstü) — tırnak şekli, parmak yapısı, ten tonu. Ücretsiz, anahtarsız.
- **Kullanıcı tasarım üretimi:** **Flux 1.1 Pro** (Replicate) — üstten çekim, izole tek tırnak tasarımı üretir.
  Anahtar yoksa demo/prosedürel önizlemeye düşer.
- **AR deneme:** MediaPipe el takibi + üretilen tasarımın canlı tırnağa bindirilmesi.
- **Galeri (vitrin):** Statik görseller (`public/designs/`, `public/images/`) — çalışma anında AI çağrısı yok.

**Diller:** Türkçe, İngilizce, Rusça, Arapça (RTL). Varsayılan İngilizce.

---

## Ekranlar (rotalar)

| Rota | Ekran | Not |
|---|---|---|
| `/` | Ana Sayfa | Trend + AI seçimleri |
| `/explore` | Keşfet | Galeri (statik görseller) |
| `/scan` | Tara | MediaPipe el analizi → otomatik Stüdyo |
| `/studio` | AI Stüdyo | Prompt → Flux ile tasarım üretimi |
| `/ar` | AR Deneme | Tasarımı canlı tırnağa bindirme |
| `/shop` | Mağaza | Planlar + görsel paketleri |
| `/profile` | Profil | Hesap, favoriler, dil |
| `/design/:id` | Tasarım Detay | Görsel + bilgiler |
| `/admin` | Admin Panel | Kullanıcılar, gelir, içerik, hata müdahalesi, bakım modu |

İlk açılışta tam ekran **açılış (splash) ekranı** gelir (3 sn, çok dilli slogan).

---

## Ana akış

1. **Tara:** Kullanıcı elini kameraya gösterir (veya fotoğraf yükler). MediaPipe tırnak şeklini/ten tonunu çıkarır.
2. **Otomatik üretim:** Analiz biter bitmez Stüdyo'ya geçilir; el verisine göre tasarım **otomatik** üretilir (Flux).
3. **AR dene:** "AR'da Dene" ile tasarım canlı tırnağa bindirilir.
4. **Kaydet / mağaza:** Favori, satın alma, paketler.

---

## Kurulum ve çalıştırma (yerel)

Tek komut (her şeyi başlatır ve ayakta tutar):

```
run.bat   (çift tık)  → backend (3000) + ön yüz (4200) + otomatik-git birlikte; biri kapanırsa yeniden başlar
```

Elle:
```
cd server && npm install && npm start      # arka uç, http://localhost:3000
npm install && npm start                    # ön yüz, http://localhost:4200
```

Ön yüz `/api` ve `/images` isteklerini `proxy.conf.json` ile 3000'e yönlendirir.

### Ortam değişkenleri (server/.env)
- `DATABASE_URL` — SQLite (yerel) / PostgreSQL (yayın)
- `JWT_SECRET` — kimlik jetonu gizli anahtarı
- `REPLICATE_API_TOKEN` — **Flux 1.1 Pro** (kullanıcı tasarım üretimi). Yoksa demo modu.
- (Opsiyonel) `TWILIO_*` (SMS OTP), `SMTP_*` (şifre e-postası), `IYZICO/STRIPE/PAYTR` (ödeme).
  Anahtar yoksa ilgili özellik **demo modunda** çalışır.

---

## Galeri görselleri

Keşfet/Ana Sayfa görselleri statik dosyalardır: `public/designs/design-1.jpg … design-8.jpg`
(kullanıcının kendi nail art görselleri). Dosya yoksa istemci-tarafı çizim önizlemesine düşülür.

---

## Admin

`/admin` — ayrı giriş, `role="admin"`. Sekmeler: Panel, Kullanıcılar, Siparişler & Gelir,
Tasarımlar & İçerik, Engellenenler, Sistem (canlı hata kaydı + bakım modu).
Demo admin: `server/scripts/create-admin.js` → `admin@demo.com / Admin123`.

---

## Yayına çıkış (özet)

1. `schema.prisma` provider → `postgresql`, `prisma db push`.
2. Backend Angular derlemesini de sunar; `render.yaml`.
3. `JWT_SECRET`, `DATABASE_URL`, `REPLICATE_API_TOKEN` ortam değişkenleri.
4. Canlı adres → PWABuilder ile APK/AAB.

Detaylı mimari kararlar için `ADR.md`.
