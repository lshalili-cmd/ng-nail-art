import { test, expect } from '@playwright/test';

// ============================================================================
// CANLI ORTAM DUMAN TESTLERİ — https://miracle-nailart.onrender.com
// Render ücretsiz planda site uyur; ilk test "uyandırma" görevi görür.
// Çalıştır: canli-test.bat (çift tık)
// ============================================================================

// Onboarding/splash'i ve dili sabitle ki testler kararlı olsun.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ngnail-onboarded', '1');
      localStorage.setItem('ngnail-splash-seen', '1');
      localStorage.setItem('ngnail-locale', 'tr');
    } catch { /* geç */ }
  });
});

test('1) canlı site uyanıyor ve sağlıklı (api/health)', async ({ request }) => {
  // Uykudan uyanma 60-90 sn sürebilir → sabırla birkaç kez dene.
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) {
    try {
      const res = await request.get('/api/health', { timeout: 30_000 });
      if (res.ok()) {
        const json = await res.json();
        ok = json && json.success === true;
      }
    } catch { /* uyanıyor olabilir — tekrar dene */ }
    if (!ok) await new Promise((r) => setTimeout(r, 15_000));
  }
  expect(ok, 'Canlı site /api/health success dönmedi (uyanamadı?)').toBe(true);
});

test('2) ana sayfa yüklenir, alt menü 6 sekme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-root')).toBeVisible();
  await expect(page.locator('app-bottom-nav a, app-bottom-nav button')).toHaveCount(6);
});

test('3) sayfa donmuyor — 5 sn içinde etkileşime hazır', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  // Ana iş parçacığı kilitliyse bu değerlendirme zaman aşımına düşer.
  const t0 = Date.now();
  await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
  expect(Date.now() - t0, 'Ana iş parçacığı kilitli görünüyor (donma!)').toBeLessThan(5000);
  expect(errors).toEqual([]);
});

test('4) galeri gerçek fotoğrafları sunuyor (/designs)', async ({ request }) => {
  const res = await request.get('/designs/design-1.jpg', { timeout: 30_000 });
  expect(res.status(), '/designs/design-1.jpg bulunamadı').toBe(200);
});

test('5) keşfet açılır ve tasarım kartları görünür', async ({ page }) => {
  await page.goto('/explore');
  await expect(page.locator('app-design-card').first()).toBeVisible({ timeout: 20_000 });
});

test('6) giriş sistemi çalışıyor (admin API girişi)', async ({ request }) => {
  const res = await request.post('/api/auth/login', {
    data: { email: 'admin@demo.com', password: 'Admin123' },
    timeout: 30_000,
  });
  const json = await res.json();
  expect(json.success, 'Canlıda admin girişi başarısız: ' + JSON.stringify(json)).toBe(true);
  expect(json.user?.role).toBe('admin');
});

test('7) admin sayfası donmadan açılır', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/admin');
  await expect(page.getByText('Yönetici Girişi')).toBeVisible({ timeout: 20_000 });
  expect(errors).toEqual([]);
});
