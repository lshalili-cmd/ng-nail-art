const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: [
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=CalculateNativeWinOcclusion',
    '--force-color-profile=srgb',
  ]});
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: '/home/claude/ngNailArt/docbuild/vid', size: { width: 1280, height: 720 } },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const t0=Date.now();
  await p.goto('file:///home/claude/ngNailArt/anim-hand.html');
  try { await p.waitForFunction('window.__ANIM_DONE__===true', { timeout: 120000 }); console.log('done in', ((Date.now()-t0)/1000).toFixed(1),'s'); }
  catch(e){ console.log('TIMEOUT'); }
  await p.waitForTimeout(1200);
  await ctx.close();
  await b.close();
  console.log('ERRORS:', errs.join('|')||'none');
})();
