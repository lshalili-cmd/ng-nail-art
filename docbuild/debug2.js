const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
  const p = await b.newPage({ viewport:{width:1280,height:720}});
  const t0=Date.now();
  await p.goto('file:///home/claude/ngNailArt/anim-render.html');
  for(let i=0;i<22;i++){
    await p.waitForTimeout(2000);
    const st=await p.evaluate(()=>({done:!!window.__ANIM_DONE__,eye:(document.querySelector('.eyebrow')||{}).textContent||(document.querySelector('.logo')?'LOGO':'(none)')}));
    console.log(((Date.now()-t0)/1000).toFixed(0)+'s', JSON.stringify(st));
    if(st.done){console.log('DONE at',((Date.now()-t0)/1000).toFixed(1),'s');break;}
  }
  await b.close();
})();
