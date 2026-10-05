import {readFile,writeFile} from 'node:fs/promises';
let s=await readFile('scripts/test-redesign-browser.mjs','utf8');
s=s.replace("  await page.goto('http://localhost:3100/');",`  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    for(const route of ['home','notes','prayer','memories','activities','settings']){
      await page.goto('http://localhost:3100/'+route);
      await page.locator('.bottom-nav').waitFor({state:'attached'});
      const text=await page.locator('body').innerText();
      for(const removed of [C.home.eyebrow,C.notes.subtitle,C.prayer.subtitle,C.memories.subtitle,C.activities.subtitle,C.redesign.searchAll,C.couples.waiting,C.settings.installHint])assert.ok(!text.includes(removed),'Removed copy still visible: '+removed);
      assert.equal(await page.locator('.theme-card').count(),0);
    }
    console.log('PASS requested copy and theme card absent on six routes: '+width);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://localhost:3100/');`);
await writeFile('.impeccable/test-copy-removal.mjs',s);
