import {readFile,writeFile} from 'node:fs/promises';
const s=(await readFile('scripts/test-redesign-browser.mjs','utf8')).replaceAll('\r\n','\n').replaceAll('localhost:3100','localhost:3000');
const prefix=s.slice(0,s.indexOf('try {\n  await page.goto'));
await writeFile('.impeccable/check-nunito.mjs',prefix+`try {
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  for(const route of ['home','notes','prayer','memories','activities','settings']){
   await page.goto('http://localhost:3000/'+route);await page.locator('.bottom-nav').waitFor({state:'attached'});
   const v=await page.evaluate(async()=>{await document.fonts.ready;const body=getComputedStyle(document.body),h=getComputedStyle(document.querySelector('h1'));return {family:body.fontFamily,size:body.fontSize,weight:body.fontWeight,line:body.lineHeight,title:h.fontWeight,loaded:document.fonts.check('400 16px '+body.fontFamily,'Đặng Minh Tài — lời nhắn người ấy'),overflow:document.documentElement.scrollWidth>innerWidth+1}});
   assert.ok(v.family.includes('Nunito'));assert.equal(v.size,'16px');assert.equal(v.weight,'400');assert.equal(v.line,'25.6px');assert.equal(v.title,'800');assert.equal(v.loaded,true);assert.equal(v.overflow,false);
  }
  console.log('PASS Nunito loaded incl Vietnamese, 400/16/1.6, title800; six routes fit '+width);
 }
}finally{await browser.close();}`);
