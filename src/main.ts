import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// ---------------------------------------------------------------------------
// PWA servis worker KAPATILDI. Daha önce kayıtlı bir servis worker, galeri
// görsellerini ve eski derlemeyi tarayıcıda inatla önbelleğe alıyordu (yeni
// derleme + Ctrl+F5 yapsan bile eski hali gösteriyordu). Aşağıdaki blok, daha
// önce kaydolmuş TÜM servis worker'ları kaldırır ve önbelleklerini temizler —
// böylece kullanıcı yeni sürümü yüklediğinde güncel galeri anında görünür.
// ---------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => { /* sessiz geç */ });
}
if ('caches' in window) {
  caches.keys()
    .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    .catch(() => { /* sessiz geç */ });
}
