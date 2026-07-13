const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
  const p = await b.newPage({ viewport:{width:1280,height:720}});
  const logs=[];
  p.on('console',m=>logs.push('CONSOLE '+m.type()+': '+m.text()));
  p.on('pageerror',e=>logs.push('PAGEERR: '+e.message));
  await p.evaluateOnNewDocument?.(()=>{});
  await p.goto('file:///home/claude/ngNailArt/anim-render.html');
  await p.evaluate(()=>{ window.addEventListener('unhandledrejection',e=>{ (window.__REJ__=window.__REJ__||[]).push(''+ (e.reason&&e.reason.message||e.reason)); }); });
  for(let i=0;i<14;i++){
    await p.waitForTimeout(2000);
    const st=await p.evaluate(()=>({done:!!window.__ANIM_DONE__,prog:document.getElementById('prog').style.width,eye:(document.querySelector('.eyebrow')||{}).textContent||'(none)',rej:(window.__REJ__||[]).join(';')}));
    console.log(i*2+'s', JSON.stringify(st));
    if(st.done){console.log('DONE');break;}
  }
  console.log(logs.join('\n')||'no logs');
  await b.close();
})();
