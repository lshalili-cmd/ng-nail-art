const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 780 } });
  const errs = [];
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERR: '+e.message));
  await p.goto('file:///home/claude/ngNailArt/tanitim-video.html');
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'docbuild/vid-start.jpg', quality: 80, type:'jpeg' });
  // force render a content scene (studio) + a phone-only view using globals
  await p.evaluate(() => {
    document.getElementById('overlay').style.display='none';
    const s = SCENES[2];
    document.getElementById('stage').innerHTML =
      '<div class="scene show">'+ s.screen +
      '<div class="cap"><div class="eyebrow">'+s.eyebrow+'</div><h2>'+s.h2+'</h2><p>'+s.p+'</p></div></div>';
  });
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'docbuild/vid-studio.jpg', quality: 80, type:'jpeg' });
  console.log('CONSOLE ERRORS:', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
