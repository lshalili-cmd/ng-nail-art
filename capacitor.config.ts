import type { CapacitorConfig } from '@capacitor/cli';

// Miracle Nail Art — Capacitor yapılandırması (Android/iOS native paket için)
// Kullanım (deploy sonrası, kendi bilgisayarında):
//   npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
//   npm run build
//   npx cap add android
//   npx cap sync
//   npx cap open android   (Android Studio açılır → Build > Generate Signed Bundle/APK)
const config: CapacitorConfig = {
  appId: 'com.miracle.nailart',
  appName: 'Miracle Nail Art',
  webDir: 'dist/ng-nail-art/browser',
  server: {
    androidScheme: 'https',
    // Canlıya aldıktan sonra, uygulamayı doğrudan canlı siteye bağlamak istersen
    // aşağıyı aç ve kendi adresini yaz (o zaman APK her açılışta canlı siteyi yükler):
    // url: 'https://miraclenailart.onrender.com',
    // cleartext: false,
  },
  android: {
    backgroundColor: '#0c0a08',
  },
};

export default config;
