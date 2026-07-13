> **📌 Güncel not (10 Temmuz 2026):** Aşağıdaki analiz 17 Haziran'da hazırlandı. Uygulamanın güncel halinde
> AI görsel üretimi **Imagen 3 yerine Flux 1.1 Pro** (Replicate) ile yapılıyor — görsel başına maliyet
> benzer (~$0.04). Galeri artık statik (kendi görsellerin, bedava). Doğrulama için başlangıçta
> **Firebase Phone Auth** (10.000 SMS/ay ücretsiz) önerisi hâlâ geçerli. Rakamlar ve mantık büyük ölçüde aynıdır.

# 💰 Miracle Nail Art — Finansal Analiz v3.0

> **Tarih:** 17 Haziran 2026  
> **Güncelleme:** SMS OTP maliyeti + şifre sıfırlama linki eklendi  
> **Durum:** Kod yazıldı ve sunucuda çalışıyor ✅

---

## 📦 PLAN YAPISI — Kim Ne Alıyor?

| Özellik | 🆓 Ücretsiz | 💎 Aylık Premium | 👑 Yıllık Premium |
|---------|:----------:|:----------------:|:-----------------:|
| **Fiyat** | ₺0 | **₺149.99/ay** (~$4.50) | **₺999.99/yıl** (~$30) |
| El Tarama (Scan) | 1 kez | **Sınırsız** | **Sınırsız** |
| AI Tasarım Stüdyosu | 1 kez | **Sınırsız** | **Sınırsız** |
| AR Try-On | 1 kez | **Sınırsız** | **Sınırsız** |
| AI Chat | 1 kez | **Sınırsız** | **Sınırsız** |
| Galeri (135+ tasarım) | ✅ Tam erişim | ✅ Tam erişim | ✅ Tam erişim |
| **Görsel Üretimi (Aylık)** | **1 görsel** | **50 görsel/ay** | **75 görsel/ay** |
| **Görsel Üretimi (Günlük)** | **1 görsel** | **5 görsel/gün** | **7 görsel/gün** |
| Ek Paket Alabilir mi? | ❌ | ✅ | ✅ |

---

## 🛒 EK PAKET SİSTEMİ

| Paket | Kredi | Fiyat (TL) | Fiyat ($) | Görsel Başı |
|-------|:-----:|:----------:|:---------:|:-----------:|
| 🟢 Mini | 10 görsel | **₺29.99** | $0.90 | ₺3.00 |
| 🔵 Standart | 25 görsel | **₺59.99** | $1.80 | ₺2.40 |
| 🟣 Mega | 50 görsel | **₺99.99** | $3.00 | ₺2.00 |

> Pack kredileri ay sonunda sıfırlanmaz — kullanana kadar kalır.

---

## 🔐 DOĞRULAMA SİSTEMİ — SMS OTP + E-posta Link

| İşlem | Kanal | Maliyet | Açıklama |
|-------|:-----:|:-------:|----------|
| **Kayıt doğrulama** | 📱 SMS OTP | **₺0.90/SMS** | Telefona 6 haneli kod |
| **Kod tekrar gönder** | 📱 SMS OTP | **₺0.90/SMS** | Aynı numaraya yeni kod |
| **Şifre sıfırlama** | 📧 E-posta Link | **$0 (ücretsiz)** | Gmail SMTP ile tıklanabilir link |
| **Şifre sıfırlama (tekrar)** | 📧 E-posta Link | **$0** | Aynı maile yeni link |

### SMS Maliyet Hesabı (Netgsm Kurumsal)

```
Netgsm kurumsal: 1000 SMS = 899 TL → birim: ~₺0.90/SMS ($0.027)
```

| Senaryo | Kayıt | Resend (ort) | Toplam SMS | Maliyet |
|---------|:-----:|:------------:|:----------:|:-------:|
| 50 kayıt/ay | 50 | ~10 | **60 SMS** | **₺54 ($1.62)** |
| 200 kayıt/ay | 200 | ~40 | **240 SMS** | **₺216 ($6.48)** |
| 1000 kayıt/ay | 1000 | ~200 | **1200 SMS** | **₺1,080 ($32.40)** |

> Şifre sıfırlama e-posta ile gittiği için **ek SMS maliyeti yok**. Gmail SMTP günde 500 mail ücretsiz.

---

## 💸 GİDER TABLOSU (Güncellenmiş v3)

### A. Sabit Giderler — Her Ay

| Gider | Aylık | Yıllık |
|-------|:-----:|:------:|
| VPS Sunucu (Hetzner) | $4.25 | $51 |
| Domain (.com) | $1 | $12 |
| SSL (Let's Encrypt) | $0 | $0 |
| Google Play (tek seferlik $25) | $2 | $25 |
| Apple Developer | $8.25 | $99 |
| Gmail SMTP | $0 | $0 |
| **TOPLAM** | **$15.50** | **$187** |

### B. Değişken Giderler — Kullanıcı Başı (SMS dahil)

| Kullanıcı Tipi | SMS OTP | Imagen 3 | Chat/Scan/AR | **Toplam** |
|----------------|:-------:|:--------:|:------------:|:----------:|
| 🆓 Ücretsiz kayıt | $0.027 (1 SMS) | $0.04 (1 görsel) | $0 | **$0.067** |
| 💎 Aylık Premium (50 görsel max) | $0.027 | $2.00 | $0 | **$2.03** |
| 👑 Yıllık Premium (75 görsel/ay) | $0.027 | $3.00 | $0 | **$3.03** |
| 🛒 Ek Paket (10 görsel) | — | $0.40 | — | **$0.40** |
| 🛒 Ek Paket (25 görsel) | — | $1.00 | — | **$1.00** |
| 🛒 Ek Paket (50 görsel) | — | $2.00 | — | **$2.00** |

> SMS sadece kayıtta 1 kez gönderiliyor. Premium olduktan sonra ek SMS yok.  
> Şifre sıfırlama e-posta ile → $0

---

## 💵 GELİR TABLOSU — Kullanıcı Başı NET KÂR

### Google Play (%25 komisyon)

| Gelir Kaynağı | Brüt Gelir | Komisyon | AI+SMS | **NET KÂR** |
|---------------|:----------:|:--------:|:------:|:-----------:|
| Aylık Premium | $4.50 | -$1.13 | -$2.03 | **$1.34** ✅ |
| Yıllık Premium (gerçekçi %40) | $30.00 | -$7.50 | -$14.43 | **$8.07** ✅ |
| Ek Paket Mini (10) | $0.90 | -$0.23 | -$0.40 | **$0.27** ✅ |
| Ek Paket Standart (25) | $1.80 | -$0.45 | -$1.00 | **$0.35** ✅ |
| Ek Paket Mega (50) | $3.00 | -$0.75 | -$2.00 | **$0.25** ✅ |

### Web (Stripe/iyzico — %3.5 komisyon)

| Gelir Kaynağı | Brüt Gelir | Komisyon | AI+SMS | **NET KÂR** |
|---------------|:----------:|:--------:|:------:|:-----------:|
| Aylık Premium | $4.50 | -$0.16 | -$2.03 | **$2.31** ✅ |
| Yıllık Premium | $30.00 | -$1.05 | -$14.43 | **$14.52** ✅ |

---

## 📊 GELİR PROJEKSİYONU — 3 Senaryo

### 🔴 KÖTÜ — 500 İndirme, 50 Kayıt, 5 Premium

```
GELİR:
  4× Aylık Premium  = 4 × $1.34   = $5.36
  1× Yıllık (aylık)               = $0.67
  1× Ek Paket                     = $0.35
                                     ─────
  TOPLAM:                          = $6.38

GİDER:
  Sabit:                           = $15.50
  SMS (60 adet):                   = $1.62
  Ücretsiz AI (50×$0.04):          = $2.00
                                     ─────
  TOPLAM:                          = $19.12

NET: $6.38 - $19.12 = -$12.74
🔴 AYLIK ZARAR: ~₺425
```

**Çözüm:** Sadece web'de başla → sabit gider $5 + SMS $1.62 = $6.62 → zarar sadece ₺8/ay

---

### 🟡 NORMAL — 5000 İndirme, 500 Kayıt, 50 Premium

```
GELİR:
  35× Aylık Premium = 35 × $1.34  = $46.90
  15× Yıllık (aylık)              = $10.05
  10× Ek Paket                    = $3.50
                                     ─────
  TOPLAM:                          = $60.45

GİDER:
  Sabit + sunucu upgrade:          = $19.50
  SMS (600 adet):                  = $16.20
  Ücretsiz AI (500×$0.04):         = $20.00
                                     ─────
  TOPLAM:                          = $55.70

NET: $60.45 - $55.70 = $4.75
🟡 AYLIK KÂR: ~₺158
🟡 YILLIK KÂR: ~₺1,900
```

---

### 🟢 İYİ — 20.000 İndirme, 2000 Kayıt, 200 Premium

```
GELİR:
  140× Aylık Prem.  = 140 × $1.34 = $187.60
   60× Yıllık (ay)                = $40.35
   40× Ek Paket                   = $14.00
                                     ─────
  TOPLAM:                          = $241.95

GİDER:
  Sabit + sunucu:                  = $23.50
  SMS (2400 adet):                 = $64.80
  Ücretsiz AI (2000×$0.04):        = $80.00
                                     ─────
  TOPLAM:                          = $168.30

NET: $241.95 - $168.30 = $73.65
🟢 AYLIK KÂR: ~₺2,455
🟢 YILLIK KÂR: ~₺29,460
```

---

## ⚠️ RİSK MATRİSİ (Güncel)

| Risk | Olasılık | Etki | Korunma |
|------|:--------:|:----:|---------|
| SMS maliyeti yüksek kayıt ile patlar | 🟡 Orta | 🟡 | Rate limit: IP başına 3 kayıt/saat |
| Fake numaralarla SMS suistimali | 🟡 Orta | 🟡 | Netgsm sadece teslim edilen SMS'i faturalandırır |
| Kullanıcı SMS almıyor | 🟢 Düşük | 🟡 | Resend butonu + konsol DEV mode |
| Imagen fiyatı 2× artar | 🟡 Orta | 🔴 | Fiyatı ₺149→₺199'a çık |
| Günlük limit spam engeli | ❌ Zaten var | — | 5/gün (aylık), 7/gün (yıllık) |
| 0 abone kalırsa | 🟡 Orta | 🟢 | Max zarar: $17/ay (₺566) |

---

## 🎯 KÂRA GEÇİŞ NOKTASI (Break-Even) — SMS Dahil

```
Sabit gider: $15.50/ay
SMS (tahmini 60/ay): $1.62
Ücretsiz AI (50 kayıt): $2.00
TOPLAM GİDER: $19.12/ay

Kullanıcı başı net kâr (Google Play, aylık): $1.34

Break-Even = $19.12 ÷ $1.34 = 15 aylık abone 🎯
```

| Senaryo | Break-Even |
|---------|:----------:|
| Sadece Web (gider $8.62) | **7 abone** |
| Web + Android | **12 abone** |
| Web + Android + iOS | **15 abone** |

---

## 💡 SMS MALİYETİNİ DÜŞÜRME TAKTİKLERİ

| Taktik | Tasarruf | Nasıl |
|--------|:--------:|-------|
| Netgsm toplu paket al (5000+) | **%20-30** | Birim fiyat ₺0.90→₺0.65'e düşer |
| WhatsApp Business API | **%50-70** | Meta ücretsiz 1000 mesaj/ay veriyor |
| Firebase Phone Auth | **Ücretsiz** | Google 10.000 SMS/ay ücretsiz (doğrulama için) |

> **ÖNERİ:** Başlangıçta **Firebase Phone Auth** kullan → ilk 10.000 doğrulama/ay **tamamen ücretsiz**. Netgsm'e geçiş sadece 10.000+ kullanıcıda gerekir.

---

## ✅ KODDA NE VAR?

```javascript
// _auth.js — Doğrulama Sistemi
const PLAN_LIMITS = {
  free:    { scan: 1,  ai: 1,  tryon: 1,  imageGenMonthly: 1,  imageGenDaily: 1 },
  monthly: { scan: ∞,  ai: ∞,  tryon: ∞,  imageGenMonthly: 50, imageGenDaily: 5 },
  yearly:  { scan: ∞,  ai: ∞,  tryon: ∞,  imageGenMonthly: 75, imageGenDaily: 7 }
};

// Kayıt → SMS OTP (telefona kod)
// Şifre sıfırlama → E-posta Link (maile tıklanabilir buton)

// .env değişkenleri:
// SMS_API_USER=netgsm_kullanici
// SMS_API_PASS=netgsm_sifre
// SMS_SENDER=MIRACLENAIL
// APP_URL=https://miraclenailart.com
// GMAIL_USER=mail@gmail.com
// GMAIL_APP_PASSWORD=xxxx
```

### API Endpoint'leri

| Endpoint | Method | Kanal | Açıklama |
|----------|:------:|:-----:|----------|
| `/api/auth/register` | POST | 📱 SMS | Kayıt + OTP gönder |
| `/api/auth/verify` | POST | — | OTP kodu doğrula |
| `/api/auth/resend-code` | POST | 📱 SMS | Yeni OTP gönder |
| `/api/auth/forgot-password` | POST | 📧 E-posta | Sıfırlama linki gönder |
| `/api/auth/reset-password` | POST | — | Yeni şifre kaydet |
| `/api/auth/buy-pack` | POST | — | Ek paket satın al |
| `/api/auth/packs` | GET | — | Paket fiyat listesi |

---

## 🏁 SONUÇ

| Soru | Cevap |
|------|-------|
| SMS maliyeti çok mu? | **Hayır** — kayıt başına ₺0.90 ($0.027), şifre sıfırlama ücretsiz (mail) |
| Firebase kullanılmalı mı? | **Evet başlangıçta** — 10.000 SMS/ay ücretsiz |
| Zarar eder miyim? | **Hayır** — 7-15 aboneyle kâra geçersin |
| En büyük gider? | **Ücretsiz kullanıcıların AI maliyeti** ($0.04/kişi) |
| SMS + AI toplam maliyet? | Kayıt başına **$0.067** (7 kuruş) |
