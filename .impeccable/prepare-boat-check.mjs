import {readFile,writeFile} from 'node:fs/promises';
const s=(await readFile('scripts/test-redesign-browser.mjs','utf8')).replaceAll('\r\n','\n').replaceAll('localhost:3100','localhost:3000');
const prefix=s.slice(0,s.indexOf('try {\n  await page.goto'));
await writeFile('.impeccable/check-prayer-boat.mjs',prefix+`try {
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('http://localhost:3000/prayer');
  const boat=page.locator('.boat .paper-boat').first();await boat.waitFor();
  await boat.evaluate(i=>i.decode());assert.ok((await boat.getAttribute('src')).includes('/icons/ship.webp'));
  assert.equal(await boat.getAttribute('aria-hidden'),'true');assert.ok((await page.locator('.boat small').first().innerText()).length>0);
  await page.locator('.boat').first().click();await page.getByRole('dialog').waitFor();assert.equal(await page.getByRole('dialog').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  console.log('PASS prayer river doodle asset, date and opening detail at '+width);
 }
}finally{await browser.close();}`);
