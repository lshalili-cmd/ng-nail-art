const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:760}, deviceScaleFactor:2 });
  await p.goto('file:///home/claude/ngNailArt/docbuild/auth-preview.html');
  await p.waitForTimeout(400);
  await p.screenshot({ path:'docbuild/auth-preview.png' });
  await b.close();
})();
