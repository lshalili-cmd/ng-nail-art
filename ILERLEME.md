# ngNailArt — İlerleme ve Kaldığımız Yer

Son güncelleme: 2026-07-02

## Tamamlananlar

- **Sprint 1 — İskelet:** Angular 18 (standalone, signals), 5 ekran (Ana Sayfa, Keşfet, Tara,
  Mağaza, Profil) + alt navigasyon + yönlendirme, lüks siyah/altın tema, PWA manifest.
- **i18n:** 4 dil (TR/EN/RU/AR) + otomatik RTL, sinyal tabanlı.
- **Sprint 2 — AI Studio:** `AiService` (chat + görsel üretimi + durum), `/studio` ekranı.
  Backend yoksa **demo modu** + istemci tarafında prosedürel tırnak önizlemesi (sunucu gerektirmez).
- **Sprint 3 — Gerçek kamera + MediaPipe:** `HandAnalysisService` (21 nokta), cilt tonu (ITA/LAB),
  alt ton, parmak yapısı; canlı kamera + fotoğraf yükleme yedeği. Güvenilirlik: CPU işleyici +
  her analizde taze tuval (tekrar-analiz sorunu çözüldü).
- **Sprint 4 — Öneri motoru:** `recommendation.ts` (133 puanlık skorlama portu) + `AnalysisStore`.
  Tara ve Ana Sayfa artık taramaya göre gerçek, skorlu ("💎 %NN uyum") öneriler gösteriyor.
- **Tasarım kartları:** her kart, renk/finiş etiketlerinden istemci tarafında çizilen 5 tırnaklı
  önizleme gösteriyor (`nail-art.ts`).
- **Kalite/altyapı:** ESLint (`npm run lint`, yeşil), `CLAUDE.md` check-in kuralları,
  `auto-git.ps1` ile otomatik GitHub commit+push.
- **Repo:** https://github.com/lshalili-cmd/ng-nail-art

## Çalıştırma

```
npm install         # ilk kez / bağımlılık değişince
npm start           # http://localhost:4200
npm run lint        # kod kontrolü
powershell -ExecutionPolicy Bypass -File .\auto-git.ps1   # otomatik GitHub senkronu
```

## Yarın — devam seçenekleri

1. **(a) Tırnak görsellerini zenginleştir** — French uç, ombre, mermer, krom/glitter desenleri
   (`nail-art.ts` çizicisini geliştir). Görsel etki hemen görünür.
2. **(b) Favoriler** — kalp'e basınca kalıcı kaydet (imza/servis + Profil'de listeleme).
3. **(c) Kendi Angular backend'i** — Express + Prisma + gerçek AI görsel üretimi (monolite
   bağımlılığı kaldırır).

## Bilinen notlar

- Gerçek AI görsel üretimi için eski `nail-art` backend'i `localhost:3000`'de anahtarla çalışmalı;
  aksi halde AI Studio demo/prosedürel önizleme üretir.
- Kamera güvenli bağlam (localhost) gerektirir; MediaPipe modeli ilk açılışta CDN'den iner.
