import type { CapacitorConfig } from '@capacitor/cli';

// NGNAILART — Capacitor yapılandırması (Android/iOS native paket için)
// Kullanım (deploy sonrası, kendi bilgisayarında):
//   npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
//   npm run build
//   npx cap add android
//   npx cap sync
//   npx cap open android   (Android Studio açılır → Build > Generate Signed Bundle/APK)
const config: CapacitorConfig = {
  appId: 'com.ngnailart.app',
  appName: 'NGNAILART',
  webDir: 'dist/ng-nail-art/browser',
  server: {
    androidScheme: 'https',
    // APK, gömülü statik dosyalar yerine doğrudan canlı siteyi yükler — böylece
    // hem içerik hem /api/* çağrıları aynı kaynaktan (ngnailart.com) gelir, ayrıca
    // her açılışta güncel sürüm gösterilir (APK'yı her deploy'da yeniden derlemeye gerek kalmaz).
    url: 'https://ngnailart.com',
  },
  android: {
    backgroundColor: '#0c0a08',
  },
};

export default config;
