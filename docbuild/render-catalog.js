const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = path.join(__dirname, '..', 'public', 'designs');
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = 'file://' + path.join(__dirname, 'catalog-render.html');

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium/chrome-linux/chrome' }).catch(async () => {
    return chromium.launch();
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });

  for (let i = 0; i < 9; i++) {
    await page.goto(`${htmlPath}?i=${i}`, { waitUntil: 'networkidle' });
    await page.waitForFunction('window.__ready === true');
    await page.waitForTimeout(200);
    const file = path.join(outDir, `design-${i + 1}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 900, height: 1200 } });
    console.log('  ✓ design-' + (i + 1) + '.jpg');
  }
  await browser.close();
  console.log('Bitti → public/designs/');
})();
