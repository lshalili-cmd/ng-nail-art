const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
  const p = await b.newPage({ viewport:{width:1280,height:720}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/claude/ngNailArt/anim-hand.html');
  const shots={4:'scan',9:'red',15:'ai',20:'black'};
  let last=0;
  for(const t of Object.keys(shots).map(Number)){
    await p.waitForTimeout((t-last)*1000); last=t;
    await p.screenshot({path:`docbuild/h_${shots[t]}.jpg`,quality:82,type:'jpeg'});
  }
  console.log('ERRORS:',errs.join('|')||'none');
  await b.close();
})();
