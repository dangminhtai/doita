import {readFile,writeFile} from 'node:fs/promises';
const s=(await readFile('scripts/test-redesign-browser.mjs','utf8')).replaceAll('\r\n','\n').replaceAll('localhost:3100','localhost:3000');
const prefix=s.slice(0,s.indexOf('try {\n  await page.goto'));
await writeFile('.impeccable/check-doodle-art.mjs',prefix+`try {
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  for(const route of ['home','notes','prayer','memories','activities','settings','auth']){
   await page.goto('http://localhost:3000/'+route);
   await page.locator('main').waitFor();
   await page.waitForFunction(()=>[...document.querySelectorAll('img[src*="/themes/sunset/doodle-art/"]')].filter(i=>i.getBoundingClientRect().width&&i.getBoundingClientRect().height).every(i=>i.complete&&i.naturalWidth>0));
   const broken=await page.locator('img[src*="/themes/sunset/doodle-art/"]').evaluateAll(items=>items.filter(i=>i.getBoundingClientRect().width&&i.complete&&!i.naturalWidth).length);
   assert.equal(broken,0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(route==='home'){assert.ok(await page.locator('img[src*="/themes/sunset/doodle-art/"]').count()>0);await page.screenshot({path:'doita-test/redesign-evidence/doodle-art-home-'+width+'.png',fullPage:true});}
  }
  console.log('PASS new theme artwork loads; seven routes fit width '+width);
 }
 assert.deepEqual(failures,[]);
} finally {await browser.close();}`);
