# Miracle Nail Art AI — İmplementasyon Dokümanı

**Proje:** ngNailArt (Angular temiz yeniden yapılanma)
**Sürüm:** 0.1.0
**Tarih:** 2026-07-03
**Depo:** github.com/lshalili-cmd/ng-nail-art

---

## 1. Genel Bakış

Miracle Nail Art AI, yapay zekâ destekli bir tırnak tasarımı uygulamasıdır. Kullanıcı elini kameraya
tutar; uygulama cilt tonunu, alt tonunu ve tırnak şeklini analiz eder, buna uygun tasarımlar önerir,
AI ile yeni görseller ürettirir ve tasarımı artırılmış gerçeklikle (AR) parmağının üzerinde canlı
dener. Mobil-öncelikli, dört dilli (TR/EN/RU/AR) bir tek-sayfa uygulamasıdır (SPA).

Uygulama iki katmandan oluşur: tamamen istemci tarafında çalışabilen bir Angular önyüzü (analiz,
AR, prosedürel görseller ve iş kuralları burada) ve isteğe bağlı bir Node/Express arka ucu (gerçek
AI görsel üretimi ve veri kalıcılığı). Arka uç kapalıyken önyüz zarifçe demo/prosedürel moda düşer.

---

## 2. Teknoloji Yığını

Önyüz Angular 18 üzerine kuruludur ve modern Angular kalıplarını uçtan uca kullanır: standalone
bileşenler (NgModule yok), signal tabanlı durum yönetimi (`signal`, `computed`, `effect`), yeni
kontrol akışı (`@if`/`@for`/`@switch`), `OnPush` değişiklik denetimi, `inject()` ile bağımlılık
enjeksiyonu ve rota bazlı tembel yükleme (`loadComponent`). Dil TypeScript'tir ve strict mod ile
strictTemplates açıktır. El takibi için `@mediapipe/tasks-vision` (HandLandmarker) kullanılır.

Arka uç Express tabanlıdır; veri katmanı Prisma ORM + SQLite'tır; AI sağlayıcıları çok-sağlayıcılı
bir soyutlama ile (OpenAI / Google Imagen / Replicate Flux) tembel yüklenir. Kod kalitesi
angular-eslint ile denetlenir.

---

## 3. Uygulama Mimarisi

Önyüz üç katmana ayrılır. **Sayfalar** (`src/app/pages/`) her biri bir rotaya karşılık gelen ekran
bileşenleridir. **Çekirdek** (`src/app/core/`) durum servislerini, alan-adı algoritmalarını ve
yardımcıları barındırır; hiçbir görsel içermez. **Paylaşılan** (`src/app/shared/`) birden çok
sayfada kullanılan sunum bileşenleridir (başlık, alt gezinme, tasarım kartı).

Rotalar sekiz ekrandan oluşur ve hepsi tembel yüklenir:

| Rota | Bileşen | İşlev |
|------|---------|-------|
| `/` | HomeComponent | Ana sayfa: trend tasarımlar, AI seçkileri, tarama kısayolu |
| `/explore` | ExploreComponent | 135+ tasarımlık galeri, kategori/arama filtreleri |
| `/scan` | ScanComponent | Kamera/foto ile el + tırnak analizi ve öneriler |
| `/studio` | StudioComponent | AI tasarım stüdyosu (metinden tasarım + görsel) |
| `/ar` | ArComponent | Canlı AR: tasarımı parmakta gerçek zamanlı deneme |
| `/shop` | ShopComponent | Üyelik planları + ek görsel paketleri |
| `/profile` | ProfileComponent | Kullanıcı, favoriler, tercihler |
| `/design/:id` | DesignDetailComponent | Tasarım detay + AR'a taşı, indir/paylaş |

Sayfalar arası durum paylaşımı signal tabanlı servislerle yapılır; örneğin Tara ekranındaki analiz
sonucu `AnalysisStore`'a yazılır ve Ana Sayfa öneriler için oradan beslenir.

---

## 4. Çekirdek Algoritmalar

### 4.1 Cilt Tonu ve Alt Ton (`skin-tone.ts`)

El sırtının merkezinden (bilek ve MCP eklemlerinin ortalaması) bir piksel yaması örneklenir, baskın
cilt rengi RGB olarak hesaplanır ve CIELAB uzayına dönüştürülür. Cilt tonu, dermatolojide kullanılan
**ITA (Individual Typology Angle)** açısıyla sekiz kademede sınıflandırılır (çok açık → çok koyu).
Alt ton (sıcak/soğuk/nötr) a\* ve b\* bileşenlerinin ilişkisinden çıkarılır. Bu değerler hem sonuç
ekranında gösterilir hem de öneri motoruna girdi olur.

### 4.2 El Takibi (`hand-analysis.service.ts`)

MediaPipe HandLandmarker iki ayrı modda yüklenir: tek-kare **IMAGE** modu tarama için (kararlılık
adına CPU-öncelikli), sürekli **VIDEO** modu AR için (`detectForVideo`, tek el, jitter'a karşı).
Model, elin 21 eklem noktasını verir. Parmak yapısı (kısa/orta/uzun) MCP→TIP mesafelerinin avuç
boyuna oranından hesaplanır.

### 4.3 Tırnak Şekli Algılama — iki katmanlı

Tırnak şekli, eklem-noktası modelinin doğrudan göremediği bir özelliktir; bu yüzden iki tamamlayıcı
yöntem uygulanır:

**(a) Tüm-el silüet tahmini** (`hand-analysis.service.ts` → `estimateNailShape`). Her parmak için
DIP→TIP ekseni boyunca dik yönde parmak genişliği taranır; uca doğru daralma (taper) ve uç kapağının
boy/en oranından şekil sınıflanır; dört parmağın oyu birleştirilir. Hızlı ama yaklaşık bir tahmindir
(tırnak, tüm-el karesinde küçük kaldığından) ve arayüzde "yaklaşık" olarak işaretlenir.

**(b) Tek-tırnak yakın çekim dedektörü** (`nail-shape-detect.ts`, MediaPipe gerektirmez). Kadrajı
dolduran tek tırnakta, merkezden renk-benzerliğiyle **taşma-doldurma (flood fill)** yapılarak tırnak
plakası maske olarak ayıklanır; **PCA** ile tırnağın uzun ekseni bulunur; eksen boyunca genişlik
profilinden ucun daralması ve boy/en oranı ölçülerek şekil belirlenir (oval, badem, kare, squoval,
coffin, stiletto, yuvarlak). Tırnak büyük olduğundan bu yöntem belirgin biçimde daha isabetlidir ve
saha testinde doğru sonuç vermiştir. Her iki yöntemde de bir **güven yüzdesi** üretilir ve **manuel
seçim** her zaman nihai kaynaktır (kullanıcı sonucu tek dokunuşla düzeltebilir).

### 4.4 Öneri Motoru (`recommendation.ts`)

Analiz çıktısı (cilt tonu, alt ton, parmak yapısı, tırnak şekli, mevsim) ile galeri tasarımları
puanlanır; en uygun tasarımlar skorlarıyla birlikte sıralanır. Analiz yoksa varsayılan seçki gösterilir.

### 4.5 Prosedürel Görsel (`nail-art.ts`)

Arka uç/gerçek AI yokken, tasarımın renk ve deseninden istemci tarafında Canvas 2D ile zengin bir
tırnak önizlemesi (data URL) üretilir; french/chrome/matte/glitter gibi desen türleri desteklenir.
Bu, AI kapalıyken bile stüdyonun ve AR'ın anlamlı görsel üretmesini sağlar.

### 4.6 AR Deneme (`ar.component.ts`)

Canlı kamera akışında MediaPipe VIDEO modu her karede eli takip eder; parmak uçlarına, seçili renk
ve desene göre oje çizilir. Titreme, **EMA yumuşatma** (α≈0.28) ve 8-karelik kalıcılık ile azaltılır;
kararlılık için tek el izlenir. Renk paleti, yakalama, indirme ve paylaşma; tasarım detay sayfasından
renk/desen parametreleriyle AR'a doğrudan geçiş desteklenir.

---

## 5. İş Kuralları — Üyelik ve Görsel Hakkı

Fiyatlandırma, kaynak dosyası `app/data/financial-config.json` (v5.0, USD) ile birebir uyumludur:
Free ($0), Aylık Premium ($7.85), Yıllık Premium ($70.65, %25 indirim), Aylık Pro ($24.99), Yıllık
Pro ($224.99, %25 indirim). Ek görsel paketleri: Mini 10 ($6), Standart 25 ($13), Mega 50 ($25).

### 5.1 Plan Yükseltme Kuralları (`plan.service.ts`, `shop.component.ts`)

Plan seçildiğinde satın alma tarihi de saklanır. Aylık planlar 30, yıllık planlar **365 gün** geçerli
sayılır. Abonelik **aktifken** aynı plan tekrar alınamaz; yalnızca izinli üst plana geçilebilir
(Free → hepsi; Aylık Premium → Yıllık Premium / Aylık Pro / Yıllık Pro; Yıllık Premium → Yıllık Pro;
Aylık Pro → Yıllık Pro; Yıllık Pro → en üst). Aktif planda "✓ kalan gün" gösterilir; izinsiz hedefler
kilitlidir. Süre dolunca kilit açılır ve kullanıcı istediği planı seçebilir (düşürme dahil); bu, süre
dolmadan paket değiştirip sistemi kandırmayı önlemek içindir.

### 5.2 Görsel Hakkı / Kota (`image-quota.service.ts`)

Her plana aylık görsel üretim hakkı bağlıdır (Free 1, Premium 30, Pro 100) ve dönem yenilendiğinde
sıfırlanır. Ek paketlerden gelen görseller, dönemden bağımsız biriken bir **cüzdan** bakiyesidir.
Üretimde önce plan hakkı, o bitince cüzdan harcanır. AI Stüdyo'da her üretim 1 görsel düşer ve kalan
sayı gösterilir; hak bitince "**Paketi Yükselt / Ek Paket Al**" uyarısı Mağaza'ya yönlendirir.

### 5.3 Ek Paket Kuralları

Bir ek paket alınınca 30 gün geçerli olur; bu süre içinde aynı paket tekrar alınamaz, yalnızca daha
büyük pakete geçilebilir (Mini → Standart → Mega). Süre dolunca hepsi yeniden açılır. Görsel bakiyesi
bu kilitlerden bağımsız birikmeye devam eder.

---

## 6. Arka Uç (`server/`)

Express sunucusu (port 3000) Angular geliştirme proxy'si üzerinden `/api` ve `/images` yollarını
karşılar. Uçlar arasında sağlık kontrolü (`/api/health`), AI durum bilgisi (`/api/ai/status`),
metinden tasarım (`/api/ai/chat`) ve görsel üretimi bulunur. AI katmanı (`ai.js`) çok-sağlayıcılıdır
ve anahtarlar tanımlı değilse zarifçe 503 döndürür; önyüz bunu yakalayıp demo/prosedürel üretime düşer.
Veri katmanı (`db.js` + `prisma/schema.prisma` + `seed.js`) SQLite üzerinde Prisma ile çalışır; veritabanı
hazır değilse `DB_NOT_READY` ile güvenli biçimde geri düşülür. Üretilen görseller `server/images/`
altında statik olarak sunulur.

Dayanıklılık ilkesi: uygulama **anahtarsız ve veritabansız da çalışır**; gerçek AI ve kalıcılık,
yapılandırma tamamlandığında devreye girer. (Gerçek görsel üretimi için API anahtarı sonradan bağlanacaktır.)

---

## 7. Yerelleştirme ve Kalıcılık

Yerelleştirme signal tabanlı bir servis (`i18n.service.ts`) ile yapılır; dört dil (TR/EN/RU/AR) ve
Arapça için RTL desteklenir. Eksik anahtarlar İngilizceye düşer. Kullanıcı durumu tarayıcıda
`localStorage` ile saklanır: seçili plan (`ngnail-plan`), görsel kotası ve ek paketler (`ngnail-quota`),
favoriler (`ngnail-favs`). Favoriler yalnızca kimlik değil, tam tasarım nesnesi olarak tutulur; böylece
AI'de üretilmiş tasarımlar da yeniden yüklenebilir.

---

## 8. Geliştirme Ortamı ve Kısıtlar

Uygulama bulut tabanlı bir oturumda geliştirilmiştir; bulut konteyneri npm kayıt defterine ve GitHub'a
erişemez. Bu nedenle bağımlılık kurulumu ve çalıştırma kullanıcının Windows makinesinde yapılır;
dosyalar oturumdan kullanıcının diskine köprü ile yazılır. GitHub eşitlemesi, kullanıcının makinesinde
çalışan bir izleyici betiği (`auto-git.ps1`) ile otomatik commit+push olarak gerçekleştirilir. Her
değişiklik bulut tarafında bir sözdizimi kontrolünden geçirilir; çalışma-zamanı doğrulaması tarayıcıda
yapılır.

---

## 9. Dosya Envanteri

**Önyüz — sayfalar:** home, explore, scan, studio, ar, shop, profile, design-detail bileşenleri.

**Önyüz — çekirdek:** `ai.service.ts` / `ai.models.ts` (AI istemcisi ve tipleri), `api.service.ts`
(HTTP), `data.service.ts` (galeri verisi), `analysis-store.ts` (paylaşılan analiz durumu),
`favorites.service.ts`, `plan.service.ts`, `image-quota.service.ts`, `i18n.service.ts`,
`hand-analysis.service.ts` (MediaPipe + cilt/şekil), `skin-tone.ts` (CIELAB/ITA), `nail-shape-detect.ts`
(yakın çekim kontur analizi), `recommendation.ts` (öneri puanlama), `nail-art.ts` (prosedürel görsel),
`share.ts` (indir/paylaş).

**Önyüz — paylaşılan:** `header.component.ts`, `bottom-nav.component.ts`, `design-card.component.ts`.

**Arka uç:** `index.js` (Express + uçlar), `ai.js` (çok-sağlayıcılı AI), `db.js` (Prisma erişimi),
`prisma/schema.prisma`, `prisma/seed.js`.

**Yapılandırma:** `app.routes.ts`, `app.config.ts`, `angular.json`, `proxy.conf.json`, `eslint.config.js`,
`tsconfig*.json`, `package.json`.

---

## 10. Bekleyen / Sonraki Adımlar

Gerçek AI görsel üretimi için sağlayıcı API anahtarının bağlanması; gerçek ödeme entegrasyonu (şu an
plan/kota seçimleri yerel olarak saklanıyor); isteğe bağlı PWA (telefona kurulabilir, çevrimdışı açılış)
ve ilk açılış tanıtım akışı; ve en yüksek tırnak-şekli doğruluğu için eğitilmiş bir segmentasyon modeli
seçeneği.
