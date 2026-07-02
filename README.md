# Miracle Nail Art AI — Angular (ngNailArt)

AI destekli tırnak tasarımı, analiz ve AR deneme platformunun **temiz Angular yeniden yapılanması**.
Bu, `nail-art` projesindeki dağınık kod tabanlarının yerini alacak tek, düzenli kod tabanının iskeletidir.

## Teknoloji

- **Angular 18** — standalone bileşenler (NgModule yok), sinyaller (signals), yeni kontrol akışı (`@if`/`@for`/`@switch`)
- **TypeScript 5.5** — strict mod
- Mobil-öncelikli, PWA-hazır; siyah + altın lüks tema (tek CSS değişken sistemi)
- Sinyal tabanlı **i18n** (TR / EN / RU / AR + otomatik RTL)

## Çalıştırma

Bilgisayarınızda (Node 18+ kurulu olmalı):

```bash
cd ngNailArt
npm install
npm start
```

Tarayıcıda otomatik açılır: http://localhost:4200

Üretim derlemesi:

```bash
npm run build     # çıktı: dist/ng-nail-art
```

> Not: İlk `npm install` internet gerektirir (npm registry). Angular CLI ayrıca global kurmak isterseniz: `npm i -g @angular/cli`.

## Klasör Yapısı

```
src/
  main.ts                 # bootstrap
  index.html, styles.css  # kabuk + global tema
  app/
    app.component.ts       # kabuk: <router-outlet> + alt navigasyon
    app.config.ts          # router sağlayıcıları
    app.routes.ts          # lazy-loaded rotalar
    core/
      i18n.service.ts       # 4 dil + RTL (sinyal tabanlı)
      data.service.ts       # örnek tasarım/sanatçı verisi (placeholder)
    shared/
      header.component.ts      # logo + dil seçici
      bottom-nav.component.ts  # 5 sekmeli alt menü
      design-card.component.ts # yeniden kullanılabilir tasarım kartı
    pages/
      home/  explore/  scan/  shop/  profile/
```

## Bu iskelette ne var (Sprint 1 — İskelet + Çalışan Temel)

- ✅ 5 ana ekran: Ana Sayfa, Keşfet, Tara, Mağaza, Profil
- ✅ Alt navigasyon + yönlendirme (lazy-loading)
- ✅ 4 dil + RTL (Arapça) — anında değişim
- ✅ Tarama akışı (idle → analiz → sonuç) — **simülasyon** (placeholder)
- ✅ Keşfet: arama + kategori filtresi (çalışır)
- ✅ Lüks tema, mobil canvas, PWA manifest

## Sıradaki adımlar (yol haritası)

1. **Gerçek AI**: `/api/ai/chat` + görsel üretimi (OpenAI/Gemini/Replicate) için bir `AiService` + ortam değişkenleri.
2. **Kamera + MediaPipe**: Tara ekranını gerçek el analizine bağla; öneri motorunu taşı.
3. **Veri katmanı**: Backend API (Prisma/PostgreSQL) + `HttpClient` servisleri; placeholder veriyi değiştir.
4. **Ödeme**: iyzico (TR) + Stripe (global) abonelik akışı.
5. **PWA/Native**: Capacitor ile Android/iOS paketleme.

Detaylı değerlendirme ve gerekçeler için: `Miracle-NailArt-Denetim-Raporu.docx` ve `Miracle-NailArt-Akis-Diyagrami.html`.
