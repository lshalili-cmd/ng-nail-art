const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const outDir = path.join(__dirname, '..', 'public', 'designs');
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = 'file://' + path.join(__dirname, 'nails-only.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  for (let i = 0; i < 9; i++) {
    await page.goto(`${htmlPath}?i=${i}`, { waitUntil: 'networkidle' });
    await page.waitForFunction('window.__ready === true'); await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(outDir, `design-${i + 1}.jpg`), type: 'jpeg', quality: 92 });
    console.log('  ✓ design-' + (i + 1));
  }
  await browser.close(); console.log('bitti');
})();
