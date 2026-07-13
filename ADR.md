# Mimari Karar Kayıtları (ADR) — Miracle Nail Art AI

Güncelleme: 10 Temmuz 2026. Her kayıt: karar, gerekçe, sonuç.

---

## ADR-01 — Ön yüz: Angular 18 (standalone + signals)
**Karar:** Standalone bileşenler, signals, yeni kontrol akışı (`@if/@for/@switch`), OnPush, strict şablonlar.
**Gerekçe:** Modül gerektirmeyen sadelik, reaktif durum, mobil-öncelikli performans.
**Sonuç:** `[(ngModel)]` signals ile çalışmaz → düz alan + FormsModule. Şablon üyeleri public olmalı.

## ADR-02 — Arka uç: Express + Prisma + SQLite (→ PostgreSQL)
**Karar:** Geliştirmede SQLite; yayında PostgreSQL. Prisma ORM ile veritabanı-bağımsız.
**Gerekçe:** SQLite kurulumsuz/hızlı; ama bulut sunucuda kalıcı değil. Prisma geçişi tek satır.
**Sonuç:** Diziler/enumlar SQLite'ta JSON string olarak tutulur. Yayında `provider="postgresql"` + `prisma db push`.

## ADR-03 — Kimlik: JWT + bcrypt, OTP ve e-posta demo-fallback
**Karar:** JWT (30 gün) + bcrypt. Telefon OTP ve şifre-sıfırlama e-postası; anahtar yoksa **demo modu** (kod/bağlantı yanıtta döner).
**Gerekçe:** Anahtarsız da çalışsın (geliştirme). Gerçek SMS = Twilio/Netgsm, e-posta = SMTP.
**Sonuç:** Yayında OTP güvenliği için SMS sağlayıcı bağlanmalı (demo güvensiz).

## ADR-04 — Dayanıklı "demo-fallback" deseni
**Karar:** Tüm dış servisler (AI, SMS, e-posta, ödeme) anahtar yoksa demo moduna düşer, uygulama çökmez.
**Gerekçe:** Her ortamda çalışabilirlik; kademeli entegrasyon.
**Sonuç:** Başlangıçta hangi servisin gerçek/demo olduğu loglanır.

## ADR-05 — Kullanıcı tasarım üretimi: Flux 1.1 Pro (Replicate)
**Karar:** Kullanıcıya özel tasarım görselleri **Flux 1.1 Pro** ile üretilir (Replicate). Prompt: **üstten çekim, izole tek tırnak, elsiz**.
**Gerekçe:** (a) Kalite/tutarlılık; (b) izole tek tırnak AR'da tırnağa temiz oturur (el fotoğrafı oturmaz).
**Değerlendirilen alternatifler:**
- *Google Gemini/Imagen (ücretsiz):* Hesap için görsel ücretsiz kotası **0** ("limit: 0") → elendi.
- *Pollinations (ücretsiz):* Çalışıyor ama el anatomisi bozuk / negatif prompt yok sayılıyor, kalite-güvenilirlik düşük → **kaldırıldı**.
**Sonuç:** Ücretli (~görsel başına birkaç sent), kredi kartı gerekir. Anahtar yoksa demo/prosedürel önizleme.

## ADR-06 — Tasarım-spec: opsiyonel LLM, yoksa istemci mockDesign
**Karar:** Görsel için gereken tasarım-spec (renk/şekil/finiş) metin LLM'i (OpenAI/Gemini) varsa ondan, yoksa istemci-tarafı sezgisel `mockDesign` ile üretilir.
**Gerekçe:** Sadece görsel sağlayıcı (Flux) bağlıyken de akış çalışsın; metin LLM'i zorunlu olmasın.
**Sonuç:** Ham kullanıcı prompt'u doğrudan görsel üretimine iletilir.

## ADR-07 — El analizi: MediaPipe (cihaz-üstü)
**Karar:** Kamera el/tırnak analizi tarayıcıda MediaPipe ile (CDN model). Anahtarsız, ücretsiz.
**Gerekçe:** Gerçek zamanlı, gizlilik (cihazda), maliyetsiz.
**Sonuç:** Kamera donanımı gerekir; yoksa fotoğraf yükleme. Analiz sonucu paylaşılan depoda tutulur (Stüdyo okur).

## ADR-08 — AR deneme: MediaPipe + izole tasarım bindirme
**Karar:** AR, el landmark'larıyla tırnak bölgelerini bulur; üretilen **izole tek tırnak** görselini tırnağa hizalar (uç→uç, uzun eksene) ve tırnak şekline kırpar.
**Gerekçe:** 2D görseli 3B tırnağa yaklaşık ama tutarlı bindirmenin doğru yolu. Yön testiyle doğrulandı.
**Sonuç:** Flux izole tırnakları temiz oturur. **Galeri el fotoğrafları** oturmaz (fotoğraf, izole tırnak değil) → galeri "Dene" sınırlı. Piksel-mükemmel değil (segmentasyon yok), sektör-standardı bindirme.

## ADR-09 — Galeri (vitrin): statik görseller, çalışma anında AI yok
**Karar:** Keşfet/Ana Sayfa galerisi statik dosyalardan (`public/designs/*.jpg`) beslenir — kullanıcının kendi nail art görselleri.
**Gerekçe:** Vitrin için her açılışta AI çağırmak maliyetli/yavaş; bir kez konur, hep kullanılır.
**Sonuç:** Pahalı AI sadece kullanıcı üretiminde; vitrin bedava. Dosya yoksa çizim önizlemesine düşülür.

## ADR-10 — Çok dillilik: TR/EN/RU/AR, varsayılan İngilizce
**Karar:** 4 dil, Arapça RTL. Varsayılan İngilizce; kullanıcı seçince kaydedilir. Açılış sloganı dahil çeviriye bağlı.
**Sonuç:** Uluslararası hedef; ilk açılış İngilizce.

## ADR-11 — Açılış (splash) ekranı: sadece ilk açılış
**Karar:** Tam ekran altın açılış ekranı, 3 sn, çok dilli slogan; `localStorage` ile yalnızca ilk açılışta.
**Sonuç:** Her açılışta beklemez.

## ADR-12 — Admin: rol tabanlı, hata kaydı, bakım modu
**Karar:** `/admin` ayrı giriş, `role="admin"`. `console.error/warn` yakalanıp `ErrorLog`'a yazılır; bakım modu anahtarı.
**Sonuç:** Sorun çıkınca panelden müdahale (hata görüntüleme, bakım moduna alma).

## ADR-13 — Teslim: ZIP + kullanıcı çıkarma; auto-git
**Karar:** Cihaz köprüsü kapalıyken güncellemeler ZIP olarak verilir, kullanıcı `D:\leman\ngNailArt`'a çıkarır (`guncelle.bat`); `auto-git.ps1` GitHub'a push eder.
**Sonuç:** Köprü açılınca doğrudan yazma mümkün olacak.

## ADR-14 — Yayına çıkış hedefi: Render + PostgreSQL (beklemede)
**Karar:** Render'da web servisi + PostgreSQL. Staging isteğe bağlı (ücretsiz katman). APK: canlı adres sonrası PWABuilder.
**Durum:** Beklemede — önce Flux bağlanacak, sonra deploy.

---

### Açık işler
- Flux 1.1 Pro anahtarının bağlanması (kullanıcı üretimi gerçek olur).
- Deploy (PostgreSQL + canlı adres).
- Gerçek SMS (OTP güvenliği), e-posta, ödeme sağlayıcıları.
- Gizlilik/KVKK metinleri; APK (PWABuilder).
