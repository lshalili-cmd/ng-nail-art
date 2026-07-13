# Miracle Nail Art — Finansal Analiz v5.0

> **Tarih:** 10 Temmuz 2026 · **Kaynak:** `financial-config.json` v5.0 (uygulamadaki gerçek fiyatlar)
> **Strateji:** 4 katmanlı USD funnel — Ücretsiz → Aylık Premium → Aylık Pro → Yıllık Premium → Yıllık Pro
> **Para birimi:** USD (dinamik TL çevrimi — Frankfurter API)

---

## PLAN YAPISI (uygulamadaki güncel fiyatlar)

| Özellik | Ücretsiz | Aylık Premium | Yıllık Premium | Aylık Pro | Yıllık Pro |
|---|:---:|:---:|:---:|:---:|:---:|
| **Fiyat** | **$0** | **$7.85/ay** | **$70.65/yıl** (~$5.89/ay) | **$24.99/ay** | **$224.99/yıl** (~$18.75/ay) |
| İndirim | — | — | %25 | — | %25 |
| **Görsel / ay** | 1 | **30** | **30** | **100** | **100** |
| Görsel / gün | 1 | 3 | 3 | 10 | 10 |
| Yıllık toplam görsel | — | — | 360 | — | 1.200 |
| El Tarama (Scan) | 1 kez | **Sınırsız** | **Sınırsız** | **Sınırsız** | **Sınırsız** |
| AI Stüdyo | 1 kez | **Sınırsız** | **Sınırsız** | **Sınırsız** | **Sınırsız** |
| AR Deneme | 1 kez | **Sınırsız** | **Sınırsız** | **Sınırsız** | **Sınırsız** |
| Ek paket alabilir | ❌ | ✅ | ✅ | ✅ | ✅ |
| Hedef | Deneme | Bireysel | Bireysel | Salon & profesyonel | Büyük salon & ajans |

> **"Sınırsız" nerede:** Tüm ücretli planlarda **Tarama, AI Stüdyo ve AR Deneme sınırsızdır.**
> Sınırlı olan yalnızca **AI görsel üretimi** (aylık kota: 30 / 100). Ücretsiz planda her şey 1 kez.

---

## EK PAKET SİSTEMİ (görsel kredisi)

| Paket | Kredi | Fiyat | Görsel başı |
|---|:---:|:---:|:---:|
| Mini | 10 görsel | **$6.00** | $0.60 |
| Standart | 25 görsel | **$13.00** | $0.52 |
| Mega | 50 görsel | **$25.00** | $0.50 |

> Paket kredileri ay sonunda sıfırlanmaz; kullanılana kadar durur.

---

## AI GÖRSEL MALİYETİ

| Sağlayıcı | Model | Görsel başı | Kullanım |
|---|---|:---:|---|
| **Flux 1.1 Pro** | Replicate `flux-1.1-pro` | **$0.040** | Kullanıcı tasarım üretimi (WOW + Pro) |
| Galeri (vitrin) | Statik görseller | **$0** | Keşfet/Ana Sayfa — çalışma anında AI çağrısı yok |

> Not: Eski v3 raporundaki Imagen 3 yerine artık **Flux 1.1 Pro** kullanılıyor (maliyet benzer, ~$0.04).
> Galeri statik olduğu için vitrin maliyeti sıfır — pahalı AI yalnızca kullanıcı üretiminde.

---

## ABONE BAŞI KÂR ve MARJ

| Plan | Fiyat (aylık eşdeğer) | Aylık AI maliyeti | Abone başı net kâr | Marj |
|---|:---:|:---:|:---:|:---:|
| Aylık Premium | $7.85 | $1.20 | **$6.65** | **%84.7** |
| Yıllık Premium | $5.89 | $1.20 | **$4.69** | **%79.6** |
| Aylık Pro | $24.99 | $4.00 | **$20.99** | **%84.0** |
| Yıllık Pro | $18.75 | $4.00 | **$14.75** | **%78.7** |

> Marjlar yüksek çünkü ana maliyet AI görsel üretimi ($0.04/görsel) ve galeri statik/bedava.
> (Komisyon: Web ~%3.5, Google Play ~%25 — mağazadan satışta net kâr bir miktar düşer.)

---

## SATIŞ HUNİSİ

1. Ücretsiz kayıt
2. Flux Pro ile "WOW" tasarım üretimi ($0.04)
3. AI sana özel tasarım seçti → AR Deneme (1 hak)
4. Premium kilidi → 4 katmanlı plan seçimi

**Dönüşüm oranı (varsayım):** %12 ücretliye geçiş · **Pro yükseltme:** %5

---

## PROJEKSİYON (v5.0)

| Aktif kullanıcı | Aylık net kâr | Marj |
|:---:|:---:|:---:|
| 1.000 | **$340** | %44.0 |
| 3.000 | **$1.255** | %54.2 |
| 5.000 | **$2.148** | %55.7 |
| 10.000 | **$4.195** | %54.4 |

- **Kâra geçiş (break-even):** ~**500 kullanıcı**, tahmini **3. ay**
- **ROI başlangıcı:** ~**5. ay**

---

## AR DENEME MALİYETİ

| Durum | Sağlayıcı | Maliyet |
|---|---|:---:|
| **Şu an** | MediaPipe Hands (cihaz-üstü) | **$0** |
| Planlanan (opsiyonel) | Banuba SDK (daha gelişmiş AR) | MAU'ya göre: 0-1.000 → $350/ay · 1.001-3.000 → $750 · 3.001-5.000 → $1.200 · 5.001-10.000 → $2.500 |

> AR şu an tamamen ücretsiz (MediaPipe). Banuba yalnızca daha profesyonel AR istenirse, ölçek büyüyünce.

---

## SONUÇ

| Soru | Cevap |
|---|---|
| Aylık Premium fiyatı? | **$7.85/ay** (eski raporda yanlışlıkla $4.50 yazıyordu) |
| Ücretli planlarda sınırsız olan? | **Tarama, AI Stüdyo, AR** — sınırsız. Sadece görsel üretimi kotalı (30/100). |
| En kârlı plan? | **Aylık Pro** — abone başı ~$20.99 net, %84 marj |
| AI maliyeti? | **$0.04/görsel** (Flux 1.1 Pro); galeri statik/bedava |
| Kâra ne zaman? | ~**500 kullanıcı / 3. ay** |
