const fs=require('node:fs');
const path='scripts/test-redesign-browser.mjs';
let source=fs.readFileSync(path,'utf8');
for(const name of ['composer','filters','activity-filters'])source=source.replaceAll(`.${name} select`,`.${name} .doita-select`);
source=source.replace(/await (page\.[^\n]+?)\.selectOption\('([^']+)'\);/g,`await pick($1, '$2');`);
source=source.replace(/(page\.locator\('[^']*doita-select'\)(?:\.last\(\)|\.first\(\))?)\.inputValue\(\)/g,`$1.getAttribute('data-value')`);
source=source.replace('const failures=[];',`const pick=async(trigger,value)=>{await trigger.click();await page.locator('.doita-select-option').filter({has:undefined}).locator('xpath=self::*[@data-value="'+value+'"]').click();};
const failures=[];`);
source=source.replace("const page=await context.newPage();",`await context.addInitScript(()=>{
  window.__autoConfirm=true;
  const observe=()=>new MutationObserver(()=>{
    if(window.__autoConfirm)document.querySelector('dialog[role="alertdialog"] .confirmation-actions button:last-child')?.click();
  }).observe(document.body,{childList:true,subtree:true});
  if(document.body)observe();else addEventListener('DOMContentLoaded',observe,{once:true});
});
const page=await context.newPage();`);
fs.writeFileSync(path,source,'utf8');
