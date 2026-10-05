import { createRequire } from 'node:module';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(join(process.env.TEMP,'doita-review-browser','package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 const page=await browser.newPage();
 const css=await readFile('src/styles/redesign.css','utf8');
 const theme='--theme-text:#302630;--theme-muted:#74616b;--theme-page:#fff7fa;--theme-paper:#fff;--theme-primary:#bc3156;--theme-soft:#ffe8f0;--theme-border:#ecd5df;--theme-river:#fff0f5;--theme-focus:#a72b50';
 await mkdir('doita-test/redesign-evidence',{recursive:true});
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:600});
  await page.setContent(`<html style="${theme}"><head><style>${css}</style></head><body><main style="padding:24px;max-width:760px;margin:auto"><details class="activity-filters"><summary>Chọn theo tâm trạng</summary><section class="activity-controls">Các lựa chọn hoạt động</section></details><div style="height:1000px"></div></main></body></html>`);
  const summary=page.locator('summary');
  await summary.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('details').evaluate(el=>el.open),true);
  await page.keyboard.press('Space');assert.equal(await page.locator('details').evaluate(el=>el.open),false);
  const styles=await page.evaluate(()=>{const s=document.querySelector('summary');return {marker:getComputedStyle(s,'::marker').content,color:getComputedStyle(s,'::after').borderRightColor,thumb:getComputedStyle(document.documentElement,'::-webkit-scrollbar-thumb').backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth}});
  assert.equal(styles.marker,'""'); assert.equal(styles.color,'rgb(188, 49, 86)');assert.equal(styles.thumb,'rgb(188, 49, 86)');assert.equal(styles.overflow,false);
  await page.screenshot({path:`doita-test/redesign-evidence/pink-disclosure-scrollbar-${width}.png`});
  console.log('PASS rendered theme CSS, Enter/Space, marker removed, rose chevron/thumb, no overflow: '+width);
 }
} finally {await browser.close()}
