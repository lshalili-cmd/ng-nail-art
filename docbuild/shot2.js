const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:440,height:900}, deviceScaleFactor:2 });
  await p.goto('file:///home/claude/ngNailArt/docbuild/splash-preview.html');
  await p.waitForTimeout(400);
  await p.screenshot({ path:'docbuild/splash-preview.png' });
  await b.close();
})();
