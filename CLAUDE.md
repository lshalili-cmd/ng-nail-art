# ngNailArt — Çalışma Kuralları (kalıcı)

## Çalışma tarzı: ADIM ADIM ONAY (en önemli kural)

- Her adımdan/değişiklikten **önce** ne yapılacağı kullanıcıya kısaca anlatılır ve **onay beklenir**.
- Kullanıcının **açıkça istemediği** hiçbir özellik, buton, bölüm veya ekran eklenmez.
- Emin olunmayan yerde tahminle ilerlenmez; sorulur.
- Onay gelince yapılır, sonra check-in özeti verilir.
- **Yapılacakların sıralı adım listesi (öneriler) her zaman kullanıcıya sunulur;** kullanıcı
  her öneriyi/adımı onaylar veya reddeder. Sıralamayı ve seçenekleri hep kullanıcı belirler.
- **Kullanıcı bir seçim yapınca/onaylayınca DOĞRUDAN yapılır** — ek alt sorular sorulmaz,
  konu dallandırılmaz, gereksiz açıklama/detay verilmez. Seçim = uygula.


Bu projede **her değişiklikten sonra**, iş bitince aşağıdaki **check-in** adımları tamamlanır ve
kullanıcıya kısa bir özet olarak raporlanır. Bu, kullanıcının her komutunda geçerlidir.

## Her komut sonrası check-in

1. **Kod doğrulama** — değişen tüm `.ts` dosyaları sözdizimi kontrolünden, `.json` dosyaları
   geçerlilik kontrolünden geçirilir (bulut ortamında otomatik).
2. **Lint** — `npm run lint` (angular-eslint). Bulut ortamı kullanıcı makinesinde kabuk
   çalıştıramadığında, lint kurulumu hazır tutulur ve kullanıcıya tek komut olarak bırakılır;
   tarayıcı testinde görülen çalışma-zamanı hataları ayrıca raporlanır.
3. **Tarayıcı & uygulama testi** — çalışan uygulama (`http://localhost:4200`) kullanıcının
   Chrome'unda açılır (Claude-in-Chrome), ana ekranlar (Ana Sayfa, Keşfet, Tara, Mağaza, Profil,
   AI Studio) gezilir ve **konsol hataları** okunur. Kırmızı hata varsa düzeltilir.
4. **GitHub check-in (commit + push)** — değişiklikler git'e commit edilip `origin main`'e push edilir.
   Bulut ortamı GitHub'a erişemediğinden bu, kullanıcı makinesinde çalışan `auto-git.ps1` izleyicisi
   tarafından otomatik yapılır (her ~90 sn'de değişiklik varsa commit+push).
5. **Check-in özeti** — ne değişti, doğrulama/lint/tarayıcı/git sonuçları tek blokta raporlanır.

## Otomatik güncelleme (elle iş YOK)

- Geliştirme **tek komutla** başlar: `dev.bat` (çift tık) / `dev.ps1` / `npm run dev`.
  Bu, `ng serve`'i `--poll 1500 --live-reload --open` ile açar ve `auto-git.ps1`'i başlatır.
- **`--poll` kritik:** dosyalar Claude köprüsüyle DIŞARIDAN yazıldığında Windows dosya-olayları
  tetiklenmeyebilir; poll olmadan Angular değişimi kaçırır, ekran ESKİ kalır. Poll bunu çözer:
  otomatik derleme + tarayıcı otomatik yenileme.
- Bu yüzden kullanıcıya artık **"hard refresh yap / sunucuyu yeniden başlat / cache temizle"
  DENMEZ.** Sistem kendi halleder. Detay: `.claude/skills/otomatik-guncelleme/SKILL.md`.
- "Ekranda hâlâ eski" denince: önce dosyanın diske doğru yazıldığını doğrula (kod doğruysa sorun
  derleme/önbellek); gerekirse `dev.ps1 -Clean` ile `.angular` temizlenip yeniden başlatılır.

## Notlar

- Dev sunucusu `dev.bat` (veya `npm run dev`) ile açık tutulur; dosya değişince otomatik derlenir
  ve tarayıcı otomatik yenilenir (`--poll` + `--live-reload`).
- Yeni bir bağımlılık eklendiğinde kullanıcı `npm install` çalıştırmalıdır (belirtilir).
- Kamera/AI gibi dış kaynaklı özellikler için hatalar konsola `[Scan]`, `[MediaPipe]`, `[AI]`
  önekleriyle loglanır.

## Teknoloji

Angular 18 (standalone bileşenler, signals, yeni kontrol akışı), TypeScript strict, mobil-öncelikli.
