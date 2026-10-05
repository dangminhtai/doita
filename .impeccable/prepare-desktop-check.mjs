import {readFile,writeFile} from 'node:fs/promises';
let s=await readFile('scripts/test-redesign-browser.mjs','utf8');
s=s.replaceAll('\r\n','\n');
const before=s.slice(0,s.indexOf('try {\n  await page.goto'));
const body=`try {
 for(const width of [1912,1440,1280,1120]){
  await page.setViewportSize({width,height:900});await page.goto('http://localhost:3000/activities');
  const tab=page.locator('.desktop-nav a[href="/settings"]');await tab.waitFor({state:'visible'});
  assert.equal(await tab.innerText(),C.nav.settings);await tab.click();
  await page.waitForURL('**/settings');assert.equal(await tab.getAttribute('aria-current'),'page');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  console.log('PASS Hai đứa visible, navigation and active state at '+width+'; overflow='+overflow);assert.equal(overflow,false);
 }
} finally {await browser.close();}
`;
await writeFile('.impeccable/check-desktop-pair.mjs',before+body);

