# Miracle Nail Art — Logo Kılavuzu & Spesifikasyonlar

Altın–siyah **line-art tırnak + pırlanta** ikonu. Koyu zeminde ince altın çerçeve,
üstte fasetli pırlanta, altında altın hatlı badem tırnak.

## Dosyalar

| Dosya | Boyut | Kullanım |
|---|---|---|
| `favicon.svg` | vektör (512 viewBox) | Tarayıcı sekmesi, keskin/ölçeklenebilir her yer |
| `icon-192.png` | 192×192 | PWA / Android ana ekran (küçük) |
| `icon-512.png` | 512×512 | PWA / uygulama ikonu (büyük), mağaza |
| `icon-maskable-512.png` | 512×512 | Android "maskable" (yuvarlak/damla maskeye uyumlu, güvenli alanlı) |
| `apple-touch-icon.png` | 180×180 | iOS ana ekran kısayolu |

Hepsi `public/` klasöründe; manifest ve index.html zaten bunlara bağlı.

## Renk spesifikasyonu

| Öğe | Değer |
|---|---|
| Zemin (koyu) | `#0c0a08` (hafif radyal altın parıltı) |
| Altın degrade | `#f6e6a8` → `#d4af37` → `#a97e22` |
| Çerçeve altını | `#f6e6a8` → `#caa233` → `#8a6a1e` |
| Parıltı vurgusu | `#fff8e7` |
| Çizgi kalınlığı | 8 px (512 ölçekte), yuvarlak uç/köşe |

## Kullanım yerleri

- **Uygulama içi:** tarayıcı sekmesi (favicon), açılış, header.
- **Telefon:** PWA/APK ana ekran ikonu (192/512 + maskable), iOS (apple-touch).
- **Mağaza:** Google Play / App Store liste ikonu — 512×512'den türetilir (Play 512, App Store 1024 ister; 512'yi büyütmek yerine gerekirse SVG'den 1024 üretilir).
- **Sosyal/tanıtım:** profil resmi, kapak, sunum.

## Maskable / güvenli alan

`icon-maskable-512.png` içeriği ortada ~%76'lık güvenli alana yerleştirildi; Android
ikonu yuvarlak, kare veya damla maskeye kırparken önemli hiçbir kısım kesilmez.

## Kelime logosu (marka adı)

**"Miracle Nail Art"** — ince, zarif **serif** (Georgia/Times ailesi), beyazdan altına degrade.
Alt slogan: *"AI designs that make you feel special"*. Simge + kelime logosu yan yana ya da
alt alta kullanılabilir.

## Yapılması / yapılmaması

- ✔ Koyu zeminde kullan; altın hatlar en iyi koyu üzerinde parlar.
- ✔ Oranı koru (kare); germe yok.
- ✔ Küçük boyutta favicon.svg veya icon-192 kullan (net kalır).
- ✘ Açık/beyaz zemine düz koyma (kontrast düşer) — gerekiyorsa koyu bir kart içine al.
- ✘ Renkleri değiştirme; altın degrade marka kimliğidir.

## Not

Bu ikon, gönderdiğin logonun yüksek çözünürlüklü (512) yeniden çizimidir. Elinde orijinal
vektör (AI/SVG) varsa onu da gönderebilirsin; bire bir onu kullanırız.
