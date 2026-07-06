import { test, expect } from '@playwright/test';

// Onboarding'i ve dili sabitle ki testler kararlı olsun.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ngnail-onboarded', '1');
      localStorage.setItem('ngnail-locale', 'tr');
    } catch { /* geç */ }
  });
});

test('ana sayfa yüklenir ve alt menü 6 sekme gösterir', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-root')).toBeVisible();
  await expect(page.locator('app-bottom-nav a, app-bottom-nav button')).toHaveCount(6);
});

test('mağaza planları gösterir', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.getByText('Aylık Premium')).toBeVisible();
  await expect(page.getByText('Aylık 30 görsel üretim')).toBeVisible();
});

test('dil değişimi kalıcı ve kartları çevirir (EN)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ngnail-locale', 'en'));
  await page.goto('/shop');
  await expect(page.getByText('Monthly Premium')).toBeVisible();
  await expect(page.getByText('30 AI images/month')).toBeVisible();
});

test('tara ekranı hatasız açılır', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/scan');
  await expect(page.locator('app-scan')).toBeVisible();
  expect(errors).toEqual([]);
});
