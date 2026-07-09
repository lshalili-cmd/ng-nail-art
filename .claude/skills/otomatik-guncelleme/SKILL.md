---
name: otomatik-guncelleme
description: >
  ngNailArt için elle iş gerektirmeyen otomatik güncelleme akışı. Kaydedilen her
  değişiklik otomatik derlenir, tarayıcı kendiliğinden yenilenir ve GitHub'a
  otomatik commit+push edilir. Kullanıcı Ctrl+F5, sunucu yeniden başlatma veya
  cache temizleme gibi manuel adımları YAPMAZ. Dev sunucu, kod değişikliği veya
  "ekranda hâlâ eski görünüyor" durumları konuşulduğunda kullan.
---

# Otomatik Güncelleme Akışı (ngNailArt)

## Amaç
Kullanıcı hiçbir manuel adım yapmasın. Bir dosya değişince: **otomatik derle →
tarayıcıyı otomatik yenile → GitHub'a otomatik gönder.**

## Tek komut
Kullanıcı yalnızca bir kez başlatır:
- `dev.bat` çift tıkla, **veya**
- `powershell -ExecutionPolicy Bypass -File .\dev.ps1`, **veya**
- `npm run dev`

Bu, `ng serve` sunucusunu şu bayraklarla açar:
- `--poll 1500` → dosyaları periyodik tarar. **Kritik:** dosyalar Claude köprüsüyle
  DIŞARIDAN yazıldığında Windows dosya-olayları tetiklenmeyebilir; poll olmadan
  Angular değişimi kaçırır ve ekran ESKİ kalır. Poll bunu çözer.
- `--live-reload` → derleme bitince tarayıcı kendini yeniler (elle Ctrl+F5 gerekmez).
- `--open` → tarayıcıyı bir kez açar.

`dev.ps1` ayrıca `auto-git.ps1` izleyicisini ayrı pencerede başlatır (otomatik
commit + push). `-NoGit` ile kapatılabilir; takılma olursa `-Clean` ile `.angular`
önbelleği temizlenir.

## "Ekranda hâlâ eski" denince
1. Dev sunucunun `--poll` ile çalıştığını doğrula (yoksa `dev.bat` ile başlat).
2. Doğrulama: dosyanın diske doğru yazıldığını teyit et; kod doğruysa sorun
   derleme/önbellektir, kod değil.
3. Gerekirse `dev.ps1 -Clean` ile `.angular` önbelleğini temizleyip yeniden başlat.

## Kural
Kod düzgünse ve `--poll` açıksa kullanıcıya artık "hard refresh yap / sunucuyu
yeniden başlat" DENMEZ; sistem kendi halleder. Yalnızca sunucu hiç çalışmıyorsa
`dev.bat`'ı başlatması istenir.
