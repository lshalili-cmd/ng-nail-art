# Miracle Nail Art — APK Hazırlık Rehberi

Bu belge, uygulamayı bir **Android APK** (ve Play için AAB) haline getirmek için hazırdır.
Uygulama zaten PWA olarak yapılandırılmış (manifest, ikonlar, service worker tam).

> ⚠️ **Ön şart:** Çalışan bir APK için backend **canlıda (deploy edilmiş)** olmalı.
> APK telefona kurulur ve telefon senin bilgisayarındaki `localhost`'a ulaşamaz.
> Bu yüzden sıra: **önce deploy → sonra APK.** (Deploy Aşama 1'deki adımlar.)

---

## Yol 1 — PWABuilder (EN KOLAY, önerilen)

Kod bilgisi gerektirmez, ~10 dakika. Uygulama zaten PWA olduğu için hazır.

1. Uygulamayı deploy et (canlı bir HTTPS adresi olsun, ör. `https://miraclenailart.onrender.com`).
2. **https://www.pwabuilder.com** adresine git.
3. Canlı adresini yaz → **Start** / **Analyze**. Aracın manifest ve service worker'ı bulup "hazır" demesi gerekir (bizimki tam).
4. **Android** kutusunda **Generate Package** / **Download**.
   - Çıktı: bir **.apk** (test için) ve bir **.aab** (Play Store için) + imza (signing) dosyaları.
   - Paket adı (package id): `com.miracle.nailart` gir.
5. **.apk**'yı telefonuna kopyalayıp kurabilirsin (test).
   **.aab**'yı Google Play Console'a yükleyip yayınlarsın.

> PWABuilder, Play için "Trusted Web Activity (TWA)" paketi üretir; yani uygulama canlı siteni
> tam ekran, adres çubuğu olmadan gösterir. Play'in kabul ettiği geçerli bir formattır.

---

## Yol 2 — Capacitor (daha "native", Android Studio ile)

Daha fazla kontrol (bildirim, kamera erişimi vb. native eklentiler) istersen. Bir Mac gerekmez
(Android için); ama **Android Studio** kurman gerekir.

Proje köküne `capacitor.config.ts` eklendi (appId: `com.miracle.nailart`). Deploy sonrası,
kendi bilgisayarında proje klasöründe:

```
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Son komut **Android Studio**'yu açar. Orada:
`Build > Generate Signed Bundle / APK` → **APK** (test) veya **AAB** (Play) seç → imza anahtarı
oluştur → derle. Çıktı `.apk` / `.aab` dosyan olur.

İki mod:
- **Gömülü mod (varsayılan):** Angular derlemesi APK'nın içine paketlenir; API çağrıları canlı
  backend'ine gider. (Ön yüz güncellenince APK'yı yeniden derlemen gerekir.)
- **Canlı-yükleme modu:** `capacitor.config.ts` içindeki `server.url`'ü canlı adresine açarsan,
  APK her açılışta canlı siteyi yükler (ön yüz güncellemeleri APK'sız yansır).

---

## Şu an hazır olanlar (bu projede)

- `public/manifest.webmanifest` — ad, standalone mod, tema rengi, 192/512/maskable ikonlar,
  kısayollar (AI Stüdyo, Tara). PWABuilder için eksiksiz.
- `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.
- Service worker kaydı (üretimde aktif).
- `capacitor.config.ts` — Capacitor yolu için hazır (appId, appName, webDir).

## Eksikler (deploy'dan sonra)

- Canlı HTTPS adres (deploy) — her iki yolun da ön şartı.
- Google Play geliştirici hesabı (~25 $ tek sefer) — yayın için.
- Mağaza görselleri: ekran görüntüleri, 1024×1024 ikon, açıklama, gizlilik politikası URL'si.

---

**Özet:** Uygulama APK'ya hazır. Tek eksik **deploy** (canlı adres). Deploy biter bitmez,
**PWABuilder**'a adresi verip 10 dakikada APK/AAB alırsın.
