import { defineConfig, devices } from '@playwright/test';

// CANLI ORTAM test ayarı — Render'daki yayındaki siteyi test eder.
// Yerel sunucu BAŞLATMAZ (webServer yok); doğrudan canlı adrese gider.
// Kullanım: canli-test.bat (çift tık)  veya  npx playwright test --config=playwright.canli.config.ts
export default defineConfig({
  testDir: './e2e',
  testMatch: /canli\.spec\.ts/,
  fullyParallel: false,          // canlı ortamda sıralı: uyanma + oturum sırası önemli
  reporter: 'list',
  timeout: 120_000,              // Render ücretsiz plan uykudan ~1 dk'da uyanır — pay bırak
  use: {
    baseURL: 'https://miracle-nailart.onrender.com',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
