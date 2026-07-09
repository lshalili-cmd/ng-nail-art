# Mimari Karar Kayıtları (ADR) — ngNailArt

Bu belge, projede alınan önemli mimari kararları; bağlamı, kararı ve sonuçlarıyla kaydeder. Her kayıt kısa ve kalıcıdır; karar değişirse yeni bir kayıt eklenir, eskisi "Yerini alan" notuyla işaretlenir.

Durum etiketleri: **Kabul edildi** (yürürlükte), **Önerildi**, **Yerini alındı**.

Güncelleme tarihi: 2026-07-07

---

## ADR-001 — Ön yüz: Angular 18 (standalone + sinyaller)

**Durum:** Kabul edildi

**Bağlam.** Önceki `nail-art` kod tabanı dağınıktı (NgModule ağırlıklı, tekrar eden yapı). Mobil-öncelikli, hızlı ve bakımı kolay tek bir kod tabanı gerekiyordu.

**Karar.** Angular 18; NgModule yok, yalnızca **standalone bileşenler**; durum yönetimi için **sinyaller** (`signal`/`computed`/`effect`); şablonlarda yeni kontrol akışı (`@if`/`@for`/`@switch`); rotalar **lazy-loaded**; değişim algılama `OnPush`. TypeScript strict ve `strictTemplates` açık.

**Sonuç.** Daha az yapısal kod, daha öngörülebilir reaktivite, küçük ilk paket. Bedeli: `strictTemplates` nedeniyle şablonda kullanılan tüm üyeler `public` olmalı; ekip yeni kontrol akışı sözdizimine alışmalı.

---

## ADR-002 — Dayanıklılık: "gevşek yükleme + demo yedek" deseni

**Durum:** Kabul edildi

**Bağlam.** Uygulama AI, ödeme, SMS ve e-posta gibi dış servislere bağlı. Geliştirme ve demo sırasında bu anahtarlar çoğu zaman yok; yine de hiçbir ekranın kırılmaması isteniyor ("webde açıldığında hata almak istemiyorum").

**Karar.** Her dış bağımlılık arka yüzde `tryRequire` ile **gevşek yüklenir** ve anahtar yoksa hata fırlatmak yerine **demo moduna** düşer: AI → prosedürel demo görsel, ödeme → demo tahsilat akışı, SMS → OTP kodu yanıtta/konsolda, e-posta → sıfırlama bağlantısı yanıtta. Ön yüz de üretim başarısızsa demo/prosedürel görsele düşer.

**Sonuç.** Anahtarsız ortamda bile tam akış test edilebilir; canlıya geçişte yalnızca `.env` doldurulur, kod değişmez. Bedeli: "demo" ile "canlı" davranış farkının kullanıcıya açıkça bildirilmesi gerekir (arayüzde not edildi).

---

## ADR-003 — Arka yüz: Express + Prisma + SQLite (geliştirme)

**Durum:** Kabul edildi

**Bağlam.** Kalıcı veri (kullanıcılar, tasarımlar, favoriler, siparişler, analizler) ve cihazlar arası senkron gerekiyordu. Kurulumun yerelde sıfır dış bağımlılıkla çalışması istendi.

**Karar.** Node/Express servis; ORM olarak **Prisma**; geliştirmede **SQLite** (tek dosya, sunucu kurulumu yok). Şema: `Design`, `Favorite`, `ScanAnalysis`, `Order`, `User`, `BlockedSignup`. SQLite dizi/enum tutmadığı için diziler JSON string olarak saklanır; `BigInt` yerine zaman damgaları `Float` (ms) tutulur (JSON güvenli).

**Sonuç.** Yerelde anında çalışır, taşınabilir. Canlı ortam için **Postgres'e geçiş** planlanır (bkz. yol haritası); Prisma sayesinde sağlayıcı değişimi düşük maliyetli.

---

## ADR-004 — Kimlik doğrulama: JWT + bcrypt + telefon OTP, benzersiz e-posta/telefon, 40 gün engel

**Durum:** Kabul edildi

**Bağlam.** Tek kullanıcı = tek üyelik olmalı; kötüye kullanım (aynı kişinin birden çok ücretsiz üyelik açması, hesabı silip hemen yeniden açması) engellenmeli.

**Karar.** Parola `bcryptjs` ile hash'lenir; oturum **JWT** ile taşınır (ön yüzde `authInterceptor` her `/api` isteğine `Bearer` ekler). Kayıt: isim + soyisim + **benzersiz e-posta VE benzersiz telefon** + parola kuralı (**tam 1 harf + geri kalanı rakam, en az 6**). Kayıt sonrası **telefon OTP** ile doğrulama zorunlu. Şifremi unuttum e-posta jetonuyla, şifre değiştir oturum içi. Hesap silme e-posta + telefon + parola doğrulamasıyla yapılır ve `BlockedSignup` kaydıyla **40 gün** aynı e-posta/telefon yeniden kayıt engellenir.

**Sonuç.** Çok-üyelik ve sil-yeniden-aç suistimalleri sınırlanır. Bedeli: OTP için SMS sağlayıcısı gerekir (yoksa ADR-002 uyarınca demo). Parola kuralı bilinçli olarak basittir (ürün gereksinimi); bu, güçlü-parola politikasından ödün verir ve ileride gözden geçirilebilir.

---

## ADR-005 — Üyelik planları ve görsel kotası (süre tabanlı yükseltme)

**Durum:** Kabul edildi

**Bağlam.** Görsel üretimi ücretli haklara bağlı; kullanıcılar plan/paket satın alır. Günlük değil, dönemsel kota isteniyor; günlük limit yok — kullanıcı hakkını istediği gün tüketebilir, hak bitince sistem üretimi durdurur.

**Karar.** Planların dönem uzunluğu sabit: aylık türevleri 30 gün, yıllık türevleri 365 gün (`PERIOD_DAYS`). Her plan aylık görsel hakkı verir (`PLAN_MONTHLY`); üretimde hak düşer (`consume()`), hak bitince arayüz "Paketi Yükselt / Ek Paket Al" uyarısı gösterir ve üretim durur (limit aşımı yok). **Yeniden satın alma kuralı:** aktif dönem dolmadan aynı plan tekrar alınamaz (kilit açılmaz); yalnızca üst plana **yükseltme** veya **ek paket** mümkün.

**Sonuç.** Net, tahmin edilebilir faturalama davranışı. Plan/kota durumu sinyallerle tutulur ve cihazlar arası senkronla DB'ye yansır (ADR-006).

---

## ADR-006 — Cihazlar arası senkron (sinyal ↔ DB)

**Durum:** Kabul edildi

**Bağlam.** Kullanıcı bir cihazda plan/hak durumunu değiştirince başka cihazda da aynısını görmeli.

**Karar.** `sync.service.ts` iki `effect` kurar: (1) **giriş anında** sunucudan çekip plan ve kota servislerine uygular (`applyServer`), (2) giriş yapılıyken plan/kota **değiştikçe** `auth.saveState` ile DB'ye yazar. Geri besleme döngüsünü önlemek için `applying` bayrağı + `queueMicrotask` kullanılır.

**Sonuç.** Yerel tepkisellik (anında UI) ile kalıcılık (DB) birleşir. Bedeli: çevrimdışıyken yazımlar sessizce ertelenir/atlanır; çakışma çözümü "son yazan kazanır" düzeyindedir (basit, yeterli).

---

## ADR-007 — Çok dillilik: sinyal tabanlı i18n + kalıcı seçim

**Durum:** Kabul edildi

**Bağlam.** TR/EN/RU/AR desteği; dil değişince **hem sayfalar hem kartlar** tam çevrilmeli; seçim kalıcı olmalı. Arapça için RTL gerekiyor.

**Karar.** Sözlükler `i18n.service.ts` içinde; metinler sinyal üzerinden okunur, dil değişince anında güncellenir. Sabit kodlanmış metinler i18n anahtarlarına taşındı; seçim `localStorage`'da (`ngnail-locale`) saklanır; Arapça'da otomatik RTL.

**Sonuç.** Anında, tam ve kalıcı dil değişimi. Bedeli: yeni metin eklerken dört dile de anahtar eklemek gerekir (eksikler dolduruldu).

---

## ADR-008 — PWA: manuel service worker kaydı

**Durum:** Kabul edildi

**Bağlam.** Uygulama yüklenebilir ve çevrimdışı-kabuklu olmalı; ancak `@angular/service-worker`'ın geliştirme derlemesini zorlaştırması istenmiyor.

**Karar.** `manifest.webmanifest` + `ngsw-config.json`; service worker `main.ts` içinde **elle** kaydedilir: yalnızca üretimde ve tarayıcı destekliyorsa (`if (!isDevMode() && 'serviceWorker' in navigator) …register('ngsw-worker.js')`).

**Sonuç.** Geliştirmede SW devre dışı (temiz yeniden yükleme), üretimde PWA aktif.

---

## ADR-009 — İstemci tarafı görü: tırnak şekli (PCA + genişlik profili) ve cilt tonu (CIELAB/ITA)

**Durum:** Kabul edildi

**Bağlam.** Tırnak şekli algılaması "çok düşük" doğruluktaydı. Analizin cihazda, sunucuya görüntü göndermeden çalışması tercih edildi (gizlilik + gecikme).

**Karar.** Tırnak şekli, maske üzerinden **PCA + genişlik-profili** ile sınıflandırılır (`classifyMaskShape`); ayrıca tek tırnak **yakın çekim dedektörü** (flood-fill, `detectNailShapeCloseup`) eklendi. Cilt tonu **CIELAB/ITA** ile hesaplanır. Segmentasyon modeli (ONNX) isteğe bağlıdır; yoksa silhouette/yedek yollar devreye girer.

**Sonuç.** Kullanıcı onaylı doğruluk artışı ("doğru algıladı"). Saf fonksiyonlar birim testlerle korunur (`skin-tone`, `nail-shape-detect`, `recommendation`).

---

## ADR-010 — Çoklu ödeme sağlayıcısı soyutlaması

**Durum:** Kabul edildi

**Bağlam.** Türkiye (iyzico, PayTR) ve global (Stripe) tahsilat gerekiyor; sağlayıcı seçimi zamanla değişebilir.

**Karar.** `payments.js` tek arayüz arkasında üç sağlayıcıyı soyutlar: Stripe Checkout, iyzico checkoutForm, PayTR token. Sağlayıcı `.env` anahtarına göre seçilir; anahtar yoksa demo akış (ADR-002).

**Sonuç.** Yeni sağlayıcı eklemek ya da değiştirmek tek modülde sınırlı kalır; ön yüz akışı aynı.

---

## ADR-011 — Test stratejisi: Vitest (birim) + Playwright (E2E), spec'ler derlemeden ayrı

**Durum:** Kabul edildi

**Bağlam.** Hızlı, tarayıcısız birim testleri ve kritik akışlar için uçtan uca testler isteniyor; ancak testlerin `ng build`'i yavaşlatması/kırması istenmiyor.

**Karar.** Birim testler **Vitest** (node ortamı, `src/**/*.spec.ts`); E2E **Playwright** (`e2e/`). `.spec.ts` dosyaları **uygulama derlemesine dahil değildir** (`tsconfig.app.json` yalnızca `main.ts` grafiğini derler).

**Sonuç.** Testler dev sunucusundan ve üretim derlemesinden yalıtık. Not: birim testleri çalıştırmak için `npm install`'ın vitest'i kurmuş olması gerekir (aksi halde `npx` geçici/yanlış sürüm indirip başarısız olur — kurulum README'de belirtildi).

---

## ADR-012 — Otomatik güncelleme akışı: `--poll` dev sunucusu + otomatik git

**Durum:** Kabul edildi

**Bağlam.** Dosyalar dışarıdan (köprüyle) yazıldığında Windows dosya-değişti olayları her zaman tetiklenmiyor; Angular izleyici değişimi kaçırıyor ve ekran eski kalıyordu. Ayrıca elle "hard refresh / sunucu yeniden başlat / cache temizle" istenmiyor.

**Karar.** Dev sunucusu `ng serve --poll 1500 --live-reload` ile açılır (`dev.ps1`); dosyalar periyodik taranır, otomatik derlenir, tarayıcı otomatik yenilenir. `auto-git.ps1` ~90 sn'de bir değişiklikleri commit'leyip push eder.

**Sonuç.** Elle adım yok; dış yazımlar da yakalanır. Bedeli: poll, olay-tabanlı izlemeye göre biraz daha fazla CPU kullanır (kabul edilebilir).

---

## ADR-013 — Bekçi (watchdog): yerelde her zaman ayakta

**Durum:** Kabul edildi

**Bağlam.** Dev sunucusu ya da arka yüz penceresi kapanınca/çökünce uygulama düşüyor ve "siteye ulaşılamıyor" hatası alınıyordu; kullanıcı her seferinde elle yeniden başlatmak istemiyor.

**Karar.** `run.bat`/`run.ps1` bir **süpervizör döngüsü** çalıştırır: arka yüz (3000) ve ön yüz (4200) TCP portlarından sağlık kontrolü yapılır; süreç çıkmışsa (ya da port boşsa) yeniden başlatılır. Süreçler `-PassThru` ile izlenir (`HasExited`), böylece derleme sürerken çift başlatma olmaz. Tarayıcı 4200 hazır olunca bir kez açılır. Windows imza sorununu atlatmak için `npm.cmd`/`npx.cmd` kullanılır.

**Sonuç.** Yerelde kesintisiz çalışma; kullanıcı yalnızca `run.bat`'e çift tıklar. Bu yerel dayanıklılık çözümüdür; kalıcı erişim için deploy ayrı bir adımdır (yol haritası).

---

## ADR-014 — Test ajanı: güncelleme öncesi/sonrası karşılaştırmalı rapor

**Durum:** Kabul edildi

**Bağlam.** Bir güncellemenin bir şeyi bozup bozmadığını (özellikle derleme hatalarını) hızlıca ve güvenle görmek isteniyor. Yalnızca TS sözdizimi kontrolü Angular şablon/anlam hatalarını yakalamaz.

**Karar.** `test.bat`/`test-agent.ps1` her çalışmada **`ng build`** (gerçek derleme kontrolü — en kritik) + **`vitest`** (birim testler) çalıştırır, isteğe bağlı lint; sonucu `test-reports/` altına tarih damgalı yazar; makine-okur bir `STATUS` satırı tutar ve **bir önceki raporla karşılaştırır**. Değişimler renkli özetlenir: derleme/testin bozulması kırmızı ("!!!"), düzelmesi yeşil ("+++"), değişiklik yoksa "Güvenli". Test sayısı çıktıdaki son "passed" değerinden okunur (dosya sayısı değil, gerçek test sayısı).

**Sonuç.** "Önce çalıştır → güncelle → sonra çalıştır" ile regresyonlar anında görünür. Bedeli: `ng build` her çalışmada 30-60 sn sürer (bilinçli tercih: kesin derleme kontrolü, yüzeysel sözdizimi kontrolüne yeğ tutuldu).

---

## Bekleyen / gelecekteki kararlar

- **Deploy mimarisi:** barındırma sağlayıcısı, ön/arka yüz aynı mı ayrı mı, alan adı, HTTPS. (Karar verilecek.)
- **Üretim veritabanı:** SQLite → Postgres geçişi ve göç stratejisi. (ADR-003'ün devamı.)
- **Parola politikası:** mevcut basit kuralın (ADR-004) güçlendirilmesi gözden geçirilebilir.
