const fs=require('node:fs');
const paths=['notes','memories','prayer','settings'].map(x=>`src/features/${x}/screen.tsx`);
for(const path of paths){
 let source=fs.readFileSync(path,'utf8');
 source=source.replace('export function ', 'import { useConfirmation } from "@/components/confirmation";\n\nexport function ');
 const brace=source.indexOf('{',source.indexOf('export function '));
 source=source.slice(0,brace+1)+'\n  const askConfirmation = useConfirmation();'+source.slice(brace+1);
 source=source.replaceAll('confirm(C.common.confirmDelete)', '(await askConfirmation(C.common.confirmDelete, { title: C.common.delete, action: C.common.delete, destructive: true }))');
 if(path.includes('notes'))source=source.replace('onClick={() => {\n                        if ((await askConfirmation','onClick={async () => {\n                        if ((await askConfirmation');
 if(path.includes('settings')){
  source=source.replaceAll('onClick={() => {\n                        if ((await askConfirmation','onClick={async () => {\n                        if ((await askConfirmation');
  source=source.replace('onClick={() => {\n                if (confirm(C.couples.confirmLeave))','onClick={async () => {\n                if (await askConfirmation(C.couples.confirmLeave, { title: C.couples.leave, action: C.couples.leave, destructive: true }))');
  source=source.replace('onClick={() => {\n                if (confirm(C.settings.confirmAccount))','onClick={async () => {\n                if (await askConfirmation(C.settings.confirmAccount, { title: C.settings.deleteAccount, action: C.settings.deleteAccount, destructive: true }))');
 }
 if(path.includes('prayer'))source=source.replace('!confirm(\n        t(C.prayer.confirmVisibility', '!await askConfirmation(\n        t(C.prayer.confirmVisibility');
 fs.writeFileSync(path,source,'utf8');
}
