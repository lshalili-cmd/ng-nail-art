import { HttpInterceptorFn } from '@angular/common/http';

/**
 * API TABAN ADRESİ — web ve native (Capacitor) için tek kaynak.
 *
 * - Web (tarayıcı): taban adres BOŞ ('') → istekler göreli kalır ('/api/...').
 *   Express uygulamayı aynı origin'den sunar; geliştirmede proxy.conf.json backend'e
 *   yönlendirir. Web davranışı HİÇ DEĞİŞMEZ.
 * - Native (Capacitor Android/iOS): uygulama cihaz içinden (androidScheme 'https' ile
 *   https://localhost gibi bir origin'den) açılır; göreli '/api' backend'e ULAŞAMAZ.
 *   Bu yüzden native'de istekler mutlak CANLI adrese yönlendirilir.
 *
 * Statik varlıklar (designs/*.jpg, images/*.png) public/ altında olduğundan native pakete
 * gömülür ve GÖRELİ kalır (çevrimdışı çalışır) — onlara dokunulmaz.
 */
const LIVE_ORIGIN = 'https://miracle-nailart.onrender.com';

/** Uygulama native kabuk (Capacitor) içinde mi çalışıyor? */
export function isNative(): boolean {
  const w = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  const cap = w.Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try { return cap.isNativePlatform(); } catch { /* geç */ }
  }
  // Yedek ipucu: yalnızca native şemalarında. (androidScheme 'https' olduğundan
  // https'i native SAYMA — web de https olabilir.)
  const proto = location.protocol;
  return proto === 'capacitor:' || proto === 'ionic:' || proto === 'file:';
}

/** API taban adresi (web'de '', native'de canlı origin). */
export function apiBase(): string {
  return isNative() ? LIVE_ORIGIN : '';
}

/** Göreli bir API yolunu (örn. '/api/...') ortama göre mutlaklaştırır; zaten mutlaksa dokunmaz. */
export function apiUrl(path: string): string {
  const base = apiBase();
  if (!base) return path;                         // web: değişmez
  if (/^https?:\/\//i.test(path)) return path;    // zaten mutlak
  return base + (path.startsWith('/') ? path : '/' + path);
}

/**
 * Göreli '/api' isteklerini native'de canlı backend'e yönlendiren interceptor.
 * Web'de apiBase() '' döndüğü için HİÇBİR ŞEY yapmaz (istek göreli kalır).
 * authInterceptor'dan SONRA çalışmalı ki token göreli '/api' eşleşmesiyle eklensin.
 */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = apiBase();
  if (base && req.url.startsWith('/api')) {
    req = req.clone({ url: base + req.url });
  }
  return next(req);
};
