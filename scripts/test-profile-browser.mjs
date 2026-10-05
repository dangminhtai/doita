// Reuse the existing HTTP/realtime fixture; all account data stays local.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
const source = (await readFile("scripts/test-redesign-browser.mjs", "utf8"))
  .replaceAll("\r\n", "\n")
  .replaceAll("localhost:3100", "localhost:3000");
const prefix = source.slice(0, source.indexOf("try {\n  await page.goto"));
const body = String.raw`
const sharp=(await import('sharp')).default;
const submitted=[];
let dropProfile=false, lockProfile=false;
const owned=tables.profiles[0];
tables.couple_members.reverse();
owned.gender=null; owned.resurfacing=true; owned.avatar_path=null;
owned.updated_at=new Date(Date.now()-10000).toISOString();
let image=await sharp({create:{width:256,height:256,channels:3,background:'#bc3156'}}).webp().toBuffer();
await context.route(url+'/storage/v1/**',async route=>{
  if(route.request().method()==='POST')return route.fulfill({json:{signedURL:'/object/sign/avatars/fixture.webp?token=fixture'}});
  return route.fulfill({body:image,contentType:'image/webp'});
});
await context.route('**/api/profile',async route=>{
  const req=route.request();
  const form=await new Request(req.url(),{method:'POST',headers:req.headers(),body:req.postDataBuffer()}).formData();
  const values=JSON.parse(form.get('profile'));
  const file=form.get('avatar');
  submitted.push({...values,bytes:file?.size??0});
  if(lockProfile){lockProfile=false;tables.couple_members=[{user_id:userId,couple_id:coupleId}];return route.fulfill({status:409,json:{error:'gender_locked'}});}
  owned.display_name=values.name;owned.gender=values.gender;owned.resurfacing=values.resurface;
  owned.updated_at=new Date().toISOString();
  if(values.avatarMode==='new'){
    image=Buffer.from(await file.arrayBuffer());
    const meta=await sharp(image).metadata();
    assert.equal(meta.width,256);assert.equal(meta.height,256);assert.ok(image.length<=81920);
    owned.avatar_path=userId+'/'+values.requestId+'.webp';
  }else if(values.avatarMode==='default')owned.avatar_path=null;
  if(dropProfile){dropProfile=false;return route.abort('failed');}
  return route.fulfill({json:{ok:true,profile:owned}});
});
try {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://localhost:3000/couple');
  await page.getByRole('heading',{name:C.settings.title,exact:true}).waitFor();
  assert.equal(await page.locator('.desktop-nav a[href="/couple"][aria-current="page"]').count(),1);
  assert.equal((await context.request.get('http://localhost:3000/settings')).status(),404);
  assert.equal(await page.getByLabel(C.profile.name,{exact:true}).count(),0);
  await page.locator('.desktop-profile').click();
  await page.getByRole('heading',{name:C.profile.title,exact:true}).waitFor();
  assert.ok(page.url().endsWith('/profile'));
  await page.goBack();
  await page.getByRole('heading',{name:C.settings.title,exact:true}).waitFor();
  assert.ok(page.url().endsWith('/couple'));
  await page.goForward();
  await page.getByRole('heading',{name:C.profile.title,exact:true}).waitFor();
  assert.equal(await page.locator('.profile-photo img').evaluate(el=>el.src),await page.locator('.desktop-profile img').evaluate(el=>el.src));
  assert.equal(await page.locator('.desktop-nav a[href="/couple"][aria-current="page"]').count(),0);
  await page.locator('.profile-form .field button').filter({hasText:C.profile.genders.unset}).click();
  await page.getByRole('heading',{name:C.profile.lockedTitle}).waitFor();
  assert.equal(submitted.length,0);
  await page.getByRole('button',{name:C.profile.manage,exact:true}).click();
  await page.getByRole('button',{name:C.couples.leave,exact:true}).last().waitFor();
  assert.ok(page.url().includes('/couple?panel=account'));
  assert.equal(await page.getByRole('button',{name:C.auth.signOut,exact:true}).count(),0);
  await page.locator('.desktop-profile').click();
  await page.getByLabel(C.profile.name,{exact:true}).fill('Tài đổi tên');
  dropProfile=true;
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
`;
// Wait for the save to settle via the enabled retry button, preserving the draft.
const remainder = String.raw`
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('.profile-fields').disabled);
  assert.equal(await page.getByLabel(C.profile.name,{exact:true}).inputValue(),'Tài đổi tên');
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
  await page.getByText(C.profile.saved,{exact:true}).waitFor();
  assert.equal(submitted[0].requestId,submitted[1].requestId);
  console.log('PASS distinct profile/couple routes, locked popup, manage-space link and lost-response retry');
  const huge=await sharp({create:{width:2048,height:2048,channels:3,background:'#bc3156'}}).png({compressionLevel:0}).toBuffer();
  assert.ok(huge.length>5*1024*1024);
  await page.getByLabel(C.profile.changeImage,{exact:true}).setInputFiles({name:'large.png',mimeType:'image/png',buffer:huge});
  await page.getByRole('heading',{name:C.profile.crop,exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('.avatar-crop canvas')?.width===256);
  await page.getByLabel(C.profile.zoom,{exact:true}).fill('1.5');
  await page.getByLabel(C.profile.horizontal,{exact:true}).fill('70');
  await page.getByRole('button',{name:C.profile.useImage,exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.profile-photo img')?.src.startsWith('data:image/webp'));
  assert.equal(await page.locator('.profile-photo img').evaluate(el=>el.getBoundingClientRect().width),88);
  // Draft image survives reload without retaining the large original.
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('.profile-photo img')?.src.startsWith('data:image/webp'));
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
  await page.getByText(C.profile.saved,{exact:true}).waitFor();
  assert.ok(submitted.at(-1).bytes>0&&submitted.at(-1).bytes<=81920);
  await page.waitForFunction(()=>document.querySelector('.profile-photo img')?.src.includes('/storage/v1/object/sign/avatars/'));
  await page.getByRole('button',{name:C.profile.defaultImage,exact:true}).click();
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.profile-fields').disabled);
  assert.equal(submitted.at(-1).avatarMode,'default');assert.equal(owned.avatar_path,null);
  assert.equal(await page.locator('.profile-photo img').evaluate(el=>el.src),await page.locator('.desktop-profile img').evaluate(el=>el.src));
  const beforeCancel=submitted.length;
  await page.getByLabel(C.profile.changeImage,{exact:true}).setInputFiles({name:'large.png',mimeType:'image/png',buffer:huge});
  await page.getByRole('heading',{name:C.profile.crop,exact:true}).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.avatar-crop').count(),0);
  assert.equal(submitted.length,beforeCancel);
  assert.equal(await page.locator('.profile-photo img').evaluate(el=>el.src.startsWith('data:')),false);
  console.log('PASS original >5MB, crop/zoom, 256x256 <=80KB upload, reload draft and default restoration');
  tables.couple_members=[];
  await page.goto('http://localhost:3000/profile');
  await page.getByLabel(C.profile.gender,{exact:true}).waitFor();
  await pick(page.getByLabel(C.profile.gender,{exact:true}),'female');
  await page.getByLabel(C.profile.name,{exact:true}).fill('Trúc');
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
  await page.getByText(C.profile.saved,{exact:true}).waitFor();
  assert.equal(submitted.at(-1).gender,'female');
  await pick(page.getByLabel(C.profile.gender,{exact:true}),'male');
  await page.getByLabel(C.profile.name,{exact:true}).fill('Tên vẫn được giữ');
  lockProfile=true;
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
  await page.getByRole('heading',{name:C.profile.lockedTitle,exact:true}).waitFor();
  assert.equal(await page.getByText(C.profile.locked,{exact:true}).count(),1);
  await page.getByRole('button',{name:C.common.close,exact:true}).last().click();
  await page.waitForFunction(()=>!document.querySelector('.profile-fields').disabled);
  assert.equal(await page.getByLabel(C.profile.name,{exact:true}).inputValue(),'Tên vẫn được giữ');
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
  await page.getByText(C.profile.saved,{exact:true}).waitFor();
  assert.equal(submitted.at(-1).gender,'female');
  assert.equal(owned.display_name,'Tên vẫn được giữ');
  console.log('PASS unpaired profile, gender confirmation, membership race and preserved editable name');
  owned.display_name='Tên từ tab khác';owned.updated_at=new Date().toISOString();emit('profiles',owned,'UPDATE');
  await page.waitForFunction(()=>document.querySelector('.profile-form input[required]')?.value==='Tên từ tab khác');
  await page.getByLabel(C.profile.name,{exact:true}).fill('Giữ bản nháp');
  owned.display_name='Tên máy khác';owned.updated_at=new Date().toISOString();emit('profiles',owned,'UPDATE');
  await page.waitForTimeout(400);
  assert.equal(await page.getByLabel(C.profile.name,{exact:true}).inputValue(),'Giữ bản nháp');
  await page.locator('.profile-form').getByRole('button',{name:C.common.save,exact:true}).click();
  await page.getByText(C.profile.saved,{exact:true}).waitFor();
  console.log('PASS Realtime updates pristine profile without overwriting unsaved fields');
  for(const width of [320,390,720,1120,1440]){
    await page.setViewportSize({width,height:1000});
    await page.evaluate(()=>document.fonts.load('16px Nunito','Tên hiển thị Giới tính'));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);
    if(!process.env.DOITA_TEST_NO_SCREENSHOTS&&(width===390||width===1440))await page.screenshot({path:'doita-test/profile-evidence/profile-'+width+'.png',fullPage:true});
  }
  assert.deepEqual(failures,[]);
  console.log('PASS profile at 320/390/720/1120/1440px, no page errors');
} finally {await browser.close();}
`;
const script = (
  "/* eslint-disable @typescript-eslint/no-unused-vars -- generated shared fixture helpers */\n" +
  prefix +
  body +
  remainder
).replaceAll(
  "http://localhost:3000",
  process.env.DOITA_TEST_ORIGIN ?? "http://localhost:3000",
);
await mkdir("doita-test/profile-evidence", { recursive: true });
const target = "doita-test/profile-browser-fixture.mjs";
await writeFile(target, script);
const child = spawn(process.execPath, ["--import", "tsx", target], {
  stdio: "inherit",
  env: process.env,
});
process.exitCode = await new Promise((resolve) =>
  child.once("exit", (code) => resolve(code ?? 1)),
);
