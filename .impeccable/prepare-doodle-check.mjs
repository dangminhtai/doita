import {readFile,writeFile} from 'node:fs/promises';
let s=await readFile('scripts/test-redesign-browser.mjs','utf8');
s=s.replace("await page.locator('.activity-filters summary').click();",`await page.locator('.activity-filters summary').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('img.doita-icon')].every(i=>i.complete&&i.naturalWidth>0));
    const iconState=await page.locator('img.doita-icon').evaluateAll(icons=>icons.map(i=>({src:i.getAttribute('src'),hidden:i.getAttribute('aria-hidden'),filter:getComputedStyle(i).filter,width:i.getBoundingClientRect().width})));
    assert.ok(iconState.length>0&&iconState.every(i=>i.src.startsWith('/themes/sunset/icons/')&&i.hidden==='true'&&i.filter==='none'&&i.width>0&&i.width<=48));
    console.log('PASS doodle icons loaded without CSS filters, decorative accessibility, size bounds: '+width);`);
await writeFile('.impeccable/test-doodle-browser.mjs',s);
