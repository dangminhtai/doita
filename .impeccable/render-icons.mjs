import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(join(process.env.TEMP,'doita-review-browser','package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
  const svg=await readFile('public/icons/icon.svg','utf8');
  for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable.png',512]]) {
    const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${svg}`);
    const png=await page.screenshot({type:'png'});
    assert.equal(png.readUInt32BE(16),size);
    assert.equal(png.readUInt32BE(20),size);
    await writeFile(`public/icons/${name}`,png);
    console.log(`${name}: ${size}x${size}, ${png.length} bytes`);
    await page.close();
  }
  // Inspect tiny rendering and Android's circular crop without changing shipping images.
  const page=await browser.newPage({viewport:{width:440,height:180}});
  const uri='data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
  await page.setContent(`<body style="margin:24px;background:white;display:flex;gap:32px;align-items:center"><img src="${uri}" width="32" height="32"><img src="${uri}" width="64" height="64"><img src="${uri}" width="128" height="128" style="border-radius:50%"></body>`);
  await page.screenshot({path:'.impeccable/icons-preview.png'});
} finally { await browser.close(); }
