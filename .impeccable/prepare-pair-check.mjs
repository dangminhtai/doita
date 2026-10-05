import {readFile,writeFile} from 'node:fs/promises';
const s=(await readFile('scripts/test-redesign-browser.mjs','utf8')).replaceAll('\r\n','\n').replaceAll('localhost:3100','localhost:3000');
const prefix=s.slice(0,s.indexOf('try {\n  await page.goto'));
await writeFile('.impeccable/check-pair-timezone.mjs',prefix+`try {
 tables.couple_members=[];
 await page.goto('http://localhost:3000/settings');
 await page.getByRole('button',{name:C.couples.create,exact:true}).waitFor();
 assert.equal(await page.getByRole('combobox').count(),0);
 assert.equal(await page.getByText(C.couples.timezone,{exact:true}).count(),0);
 const request=page.waitForRequest(r=>r.url().includes('/rpc/pair_couple'));
 await page.getByRole('button',{name:C.couples.create,exact:true}).click();
 assert.equal((await request).postDataJSON().p_timezone,'Asia/Ho_Chi_Minh');
 console.log('PASS Pair screen has no timezone picker; create sends Vietnam timezone');
} finally {await browser.close();}`);
