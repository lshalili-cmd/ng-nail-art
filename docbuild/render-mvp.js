const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.goto('file:///home/claude/ngNailArt/docbuild/mvp-kontrol.html', { waitUntil: 'networkidle' });
  await page.pdf({ path: '/home/claude/ngNailArt/Miracle-NailArt-MVP-Kontrol-Listesi.pdf', format: 'A4', printBackground: true });
  await browser.close();
  console.log('PDF olusturuldu');
})();
