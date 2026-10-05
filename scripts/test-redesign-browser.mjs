// Local browser regression tests with mocked Supabase HTTP and websocket.
// No production account, email, push or database mutation is used.
import { createRequire } from 'node:module';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { CONTENT as C } from '../src/config/content.vi.ts';
const require = createRequire(join(process.env.TEMP, 'doita-review-browser', 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const userId = '00000000-0000-0000-0000-000000000001';
const partner = '00000000-0000-0000-0000-000000000002';
const coupleId = '00000000-0000-0000-0000-000000000003';
const dailyId = '00000000-0000-0000-0000-000000000004';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ref = new URL(url).hostname.split('.')[0];
const user = {id:userId,email:'fixture@example.com',aud:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:new Date().toISOString()};
const encode = v => Buffer.from(JSON.stringify(v)).toString('base64url');
const token = `${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:userId,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.fixture`;
const session = {access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user};
const tables = {
  couple_members:[{user_id:userId,couple_id:coupleId},{user_id:partner,couple_id:coupleId}],
  profiles:[{id:userId,display_name:'QA A'},{id:partner,display_name:'QA B'}],
  couples:[{id:coupleId,timezone:'Asia/Ho_Chi_Minh',invite_code:'fixture',relationship_start_date:null}],
  daily_sessions:[{id:dailyId,couple_id:coupleId,date:'2026-10-04',status:'pending',daily_prompts:{prompt:'Fixture daily'}}],
  streaks:[{couple_id:coupleId,current_streak:0}],
  prayers:[{id:'draft-1',couple_id:coupleId,author_id:userId,content:'SERVER PRIVATE DRAFT',status:'draft',visibility:'private',metadata:{resurface:false}}],
  memories:[{id:'memory-a',couple_id:coupleId,type:'note',content:'Memory A',source_id:'note-a',created_at:'2026-10-04T12:00:00Z'},{id:'memory-b',couple_id:coupleId,type:'note',content:'Memory B',source_id:'note-b',created_at:'2026-10-04T12:00:00Z'}],
  notes:[], note_items:[], moods:[], special_dates:[], activities:[], activity_sessions:[], daily_answers:[],daily_feedback:[],streak_events:[],prayer_events:[],notifications:[],
};
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${ref}-auth-token`,session});
const channels=new Map();
const tableRequests=[];
function splitExpression(value) {
  let depth=0,quoted=false,start=0;const parts=[];
  for(let i=0;i<value.length;i++){const c=value[i];if(c==='"'&&value[i-1]!=='\\')quoted=!quoted;if(quoted)continue;if(c==='(')depth++;if(c===')')depth--;if(c===','&&depth===0){parts.push(value.slice(start,i));start=i+1;}}
  parts.push(value.slice(start));return parts;
}
function matches(row,expression) {
  for(const op of ['or','and'])if(expression.startsWith(op+'(')){const results=splitExpression(expression.slice(op.length+1,-1)).map(e=>matches(row,e));return op==='or'?results.some(Boolean):results.every(Boolean);}
  const [,key,op,value]=expression.match(/^([^.]+)\.([^.]+)\.(.*)$/)??[];
  const actual=String(row[key]);
  if(op==='eq')return actual===value;if(op==='neq')return actual!==value;
  if(op==='lt')return actual<value;if(op==='gte')return actual>=value;
  if(op==='ilike')return actual.toLowerCase().includes(value.replace(/^"|"$/g,'').replace(/^%|%$/g,'').toLowerCase());
  if(op==='is')return value==='null'?row[key]==null:actual===value;
  if(op==='in')return splitExpression(value.slice(1,-1)).includes(actual);
  if(op==='not')return !matches(row,key+'.'+value);return true;
}
await context.routeWebSocket(/realtime/,socket=>{
  socket.onMessage(raw=>{
    if(typeof raw!=='string')return;
    const parsed=JSON.parse(raw),array=Array.isArray(parsed);
    const [joinRef,ref,topic,event,payload]=array?parsed:[parsed.join_ref,parsed.ref,parsed.topic,parsed.event,parsed.payload];
    const send=(name,body)=>socket.send(JSON.stringify(array?[joinRef,ref,topic,name,body]:{join_ref:joinRef,ref,topic,event:name,payload:body}));
    if(event==='phx_join'){
      const filters=(payload.config?.postgres_changes??[]).map((filter,i)=>({...filter,id:i+1}));
      channels.set(topic,{socket,joinRef,array,filters});
      send('phx_reply',{status:'ok',response:{postgres_changes:filters}});
    }else if(event==='phx_leave'){channels.delete(topic);send('phx_reply',{status:'ok',response:{}});}
    else if(event==='heartbeat')send('phx_reply',{status:'ok',response:{}});
  });
});
function emit(table,record,type='INSERT') {
  for(const [topic,c]of channels){
    const ids=c.filters.filter(f=>f.table===table).map(f=>f.id);
    if(!ids.length)continue;
    const payload={ids,data:{schema:'public',table,type,commit_timestamp:new Date().toISOString(),columns:Object.keys(record).map(name=>({name,type:'text'})),record,old_record:{},errors:null}};
    c.socket.send(JSON.stringify(c.array?[c.joinRef,null,topic,'postgres_changes',payload]:{join_ref:c.joinRef,ref:null,topic,event:'postgres_changes',payload}));
  }
}
await context.addInitScript(()=>{
  window.__notificationTones=0;
  const original=AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator=function(...args){const oscillator=original.apply(this,args);const start=oscillator.start.bind(oscillator);oscillator.start=(...params)=>{window.__notificationTones++;return start(...params);};return oscillator;};
});
let membershipError=false,delayLoad=false;
let raceNextRefresh=false,raceDelayCount=0;
let inboxError=false;
let expireSession=false,dropNoteResponse=false;
const receiptCache=new Map(),noteRequestIds=[];
await context.route('**/api/push',route=>route.fulfill({json:{ok:true}}));
await context.route(`${url}/**`,async route=>{
  const request=route.request(),u=new URL(request.url());
  if(u.pathname.includes('/auth/v1/logout'))return route.fulfill({status:204});
  if(u.pathname.includes('/auth/v1/token')&&expireSession)return route.fulfill({status:400,json:{code:'refresh_token_not_found',message:'Invalid Refresh Token'}});
  if(u.pathname.includes('/auth/v1/'))return route.fulfill({json:user});
  if(u.pathname.includes('/rpc/')) {
    let name=u.pathname.split('/').at(-1);
    let args=request.postDataJSON();
    const requestId=name==='perform_authorized_action'?args.p_request_id:null;
    if(name==='perform_authorized_action'){name=args.p_action;args=args.p_args;}
    if(name==='save_note'){
      noteRequestIds.push(requestId);
      let id=receiptCache.get(requestId);
      if(!id){id='30000000-0000-0000-0000-000000000001';receiptCache.set(requestId,id);tables.notes.unshift({id,couple_id:coupleId,author_id:userId,title:args.p_title,content:args.p_content,type:args.p_type,visibility:args.p_visibility,created_at:new Date().toISOString()});}
      if(dropNoteResponse){dropNoteResponse=false;return route.abort('failed');}
      return route.fulfill({json:id});
    }
    if(name==='save_special_date_details'){
      const id=args.p_id??'81000000-0000-0000-0000-000000000001';
      tables.special_dates=tables.special_dates.filter(row=>row.id!==id);
      tables.special_dates.push({id,couple_id:coupleId,author_id:userId,title:args.p_title,date:args.p_date,kind:args.p_kind,custom_label:args.p_custom_label,repeat_rule:args.p_repeat_rule});
      return route.fulfill({json:id});
    }
    if(name==='prayer_action'){
      const prayer=tables.prayers.find(p=>p.id===args.p_id);
      if(prayer)prayer.status=args.p_action==='archive'?'archived':'released';
    }
    if(name==='toggle_note_item'){
      const item=tables.note_items.find(row=>row.id===args.p_id);
      item.completed=!item.completed;
      setTimeout(()=>emit('notes',tables.notes.find(row=>row.id===item.note_id),'UPDATE'),20);
    }
    if(name==='log_activity'){
      const activity={id:'activity-log',couple_id:coupleId,user_id:userId,activity_id:args.p_activity,rating:args.p_rating,created_at:new Date().toISOString()};
      tables.activity_sessions.unshift(activity);
      raceNextRefresh=true;
      setTimeout(()=>emit('activity_sessions',activity),20);
    }
    if(name==='mark_notifications_read')for(const item of tables.notifications)if(args.p_ids?.includes(item.id)||(!args.p_ids&&item.created_at<=args.p_before))item.read_at=new Date().toISOString();
    return route.fulfill({json:name==='ensure_daily'?dailyId:name==='memories_on_this_day'?[]:null});
  }
  const table=u.pathname.split('/').at(-1);
  tableRequests.push(table);
  if(table==='notifications'&&inboxError)return route.fulfill({status:503,json:{code:'fixture_error',message:'notification unavailable'}});
  if(table==='couple_members'&&membershipError)return route.fulfill({status:503,json:{code:'fixture_error',message:'offline'}});
  if(table==='memories'&&delayLoad)await new Promise(r=>setTimeout(r,700));
  if(table==='activity_sessions'&&raceNextRefresh){raceNextRefresh=false;raceDelayCount++;await new Promise(r=>setTimeout(r,650));}
  let rows=tables[table]??[];
  if(table==='notes'&&u.searchParams.get('id')==='eq.note-a'){await new Promise(r=>setTimeout(r,600));rows=[{id:'note-a',content:'DETAIL A',author_id:userId}];}
  if(table==='notes'&&u.searchParams.get('id')==='eq.note-b')rows=[{id:'note-b',content:'DETAIL B',author_id:userId}];
  for(const [key,value]of u.searchParams)if(!['select','order','limit','offset'].includes(key))rows=rows.filter(r=>matches(r,key==='or'?'or'+value:key+'.'+value));
  if(u.searchParams.has('order'))rows=[...rows].sort((a,b)=>{for(const order of u.searchParams.get('order').split(',')){const [key,direction]=order.split('.');const comparison=String(a[key]??false).localeCompare(String(b[key]??false));if(comparison)return direction==='desc'?-comparison:comparison;}return 0;});
  const total=rows.length;
  rows=rows.slice(Number(u.searchParams.get('offset')??0));
  if(u.searchParams.has('limit'))rows=rows.slice(0,Number(u.searchParams.get('limit')));
  if(u.searchParams.get('read_at')==='is.null')rows=rows.filter(r=>r.read_at==null);
  if(table==='notifications')rows=[...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const isSingle=request.headers().accept?.includes('vnd.pgrst.object');
  return route.fulfill({status:200,headers:{'content-range':`0-0/${total}`,'access-control-expose-headers':'content-range','access-control-allow-origin':'http://localhost:3100'},json:isSingle?(rows[0]??null):rows});
});
const page=await context.newPage();
page.on('dialog',dialog=>dialog.accept());
const failures=[];
page.on('pageerror',error=>failures.push(error.message));
const go=async id=>{const item=page.locator(`.bottom-nav a[href="/${id}"]`);if(await item.count())await item.click();else {const box=await page.locator('.mobile-menu').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.locator(`.sidebar a[href="/${id}"]`).click();}};
try {
  await page.goto('http://localhost:3100/');
  await page.locator('.bottom-nav').waitFor();
  if(process.env.REDESIGN_SNAPSHOTS){
    const prefix=process.env.REDESIGN_SNAPSHOTS;await mkdir('doita-test/redesign-evidence',{recursive:true});
    for(const width of [390,1440])for(const route of ['home','daily','notes','prayer','memories','activities','settings']){
      await page.setViewportSize({width,height:900});await page.goto(`http://localhost:3100/${route}`);await page.locator('.bottom-nav').waitFor({state:'attached'});await page.waitForTimeout(250);
      await page.screenshot({path:`doita-test/redesign-evidence/${prefix}-${route}-${width}.png`,fullPage:true});
    }
    await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3100/home');await page.locator('.bottom-nav').waitFor();
  }
  assert.equal(await page.locator('.bottom-nav a[href="/settings"]').count(),1);
  assert.equal(await page.locator('.bottom-nav a[href="/activities"]').count(),0);
  assert.equal(await page.locator('.bottom-nav a').count(),5);
  for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:900});await page.goto('http://localhost:3100/notes');
    await page.getByRole('searchbox').waitFor();
    const fields=await page.locator('.filters .field').evaluateAll(items=>items.map(el=>({width:el.getBoundingClientRect().width,labelHeight:el.querySelector('span').getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(el.querySelector('span')).lineHeight)})));
    assert.ok(fields.every(field=>field.width>=200&&field.labelHeight<=field.lineHeight*2+1),'Search/filter must keep usable width and readable labels');
    assert.equal(await page.getByRole('button',{name:C.notes.new,exact:true}).count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.goto('http://localhost:3100/activities');
    await page.locator('.activity-filters summary').click();
    assert.equal(await page.getByRole('button',{name:C.activities.choose,exact:true}).count(),1);
    await page.screenshot({path:`doita-test/redesign-evidence/after-activities-filters-${width}.png`,fullPage:true});
    await page.locator('.activity-filters summary').click();
    assert.equal(await page.getByRole('button',{name:C.activities.choose,exact:true}).count(),1);
    await page.goto('http://localhost:3100/prayer');
    await page.getByRole('heading',{name:C.prayer.title,exact:true}).waitFor();
    assert.equal(await page.getByText(C.prayer.subtitle,{exact:true}).count(),1);
    assert.equal(await page.getByRole('button',{name:C.prayer.write,exact:true}).count(),1);
  }
  await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3100/home');await page.locator('.bottom-nav').waitFor();
  console.log('PASS readable search/filter at desktop and narrow mobile; one compose/choose CTA and one Prayer subtitle');
  await go('prayer');
  await page.getByRole('button',{name:C.prayer.write,exact:true}).first().click();
  await page.locator('.composer textarea').fill('PRIVATE LOCAL DRAFT');
  await page.locator('.composer select').selectOption('private');
  await page.locator('.composer input[type=checkbox]').uncheck();
  await go('notes');await go('prayer');
  assert.equal(await page.locator('.composer textarea').inputValue(),'PRIVATE LOCAL DRAFT');
  assert.equal(await page.locator('.composer select').inputValue(),'private');
  assert.equal(await page.locator('.composer input[type=checkbox]').isChecked(),false);
  await page.reload();
  await page.locator('.composer textarea').waitFor();
  assert.equal(await page.locator('.composer textarea').inputValue(),'PRIVATE LOCAL DRAFT');
  await page.locator('.section .prayer-row').click();
  assert.equal(await page.locator('.composer textarea').inputValue(),'SERVER PRIVATE DRAFT');
  assert.equal(await page.locator('.composer input[type=checkbox]').isChecked(),false);
  await page.getByRole('button',{name:C.common.close,exact:true}).click();
  await page.getByRole('button',{name:C.prayer.write,exact:true}).first().click();
  assert.equal(await page.locator('.composer textarea').inputValue(),'SERVER PRIVATE DRAFT');
  const stored=await page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+':draft-1')),`couple-draft:${userId}:prayer:${coupleId}`);
  assert.equal(stored.draftId,'draft-1');
  console.log('PASS browser prayer privacy/edit/resurface across navigation/reload/close');
  await go('notes');await go('activities');await page.goBack();
  await page.waitForURL('**/notes');assert.equal(await page.getByRole('heading',{name:C.notes.title,exact:true}).count(),1);
  await page.goForward();await page.waitForURL('**/activities');
  await page.getByRole('button',{name:C.activities.choose,exact:true}).click();
  await page.getByText(C.activities.none,{exact:true}).waitFor();
  console.log('PASS browser Back/Forward, complete bottom nav and initial empty activity result');
  tables.activities.push({id:'fixture-activity',title:'Fixture Activity',description:'Try together',category:'chat',duration:5,energy:'low',enabled:true,long_distance:true,tags:[]});
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(250);
  await page.getByRole('button',{name:C.activities.choose,exact:true}).click();
  tableRequests.length=0;
  await page.getByRole('button',{name:C.activities.like,exact:true}).click();
  assert.equal(await page.getByRole('button',{name:C.activities.dislike,exact:true}).isDisabled(),true);
  assert.equal(await page.locator('.activity-filters select').first().isEnabled(),true);
  await page.getByText(C.activities.liked,{exact:true}).waitFor();
  assert.equal(raceDelayCount,1);
  assert.equal(tableRequests.includes('notes'),false);
  assert.equal(tableRequests.includes('prayers'),false);
  assert.equal(await page.getByText(C.errors.refreshFailed,{exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:C.activities.like,exact:true}).getAttribute('aria-pressed'),'true');
  console.log('PASS like overlapping Realtime refresh shows success and selected rating');
  while(![...channels.keys()].some(key=>key.includes('notifications-')))await new Promise(r=>setTimeout(r,20));
  const incoming={id:'10000000-0000-0000-0000-000000000001',user_id:userId,couple_id:coupleId,actor_id:partner,kind:'reaction',url:'/daily',created_at:new Date().toISOString(),read_at:null};
  tables.notifications.unshift(incoming);emit('notifications',incoming);
  await page.locator('.notification-badge').filter({hasText:'1'}).waitFor();
  await page.waitForFunction(()=>window.__notificationTones===2);
  await page.locator('.notification-bell').click();
  await page.getByText(C.notifications.reaction,{exact:true}).waitFor();
  await page.getByRole('button',{name:C.notifications.soundOn,exact:true}).click();
  await page.getByRole('button',{name:C.notifications.soundOff,exact:true}).waitFor();
  await page.locator('dialog button').filter({hasText:C.common.close}).click();
  const second={...incoming,id:'10000000-0000-0000-0000-000000000002',kind:'note',url:'/notes',created_at:new Date().toISOString()};
  tables.notifications.unshift(second);emit('notifications',second);
  await page.locator('.notification-badge').filter({hasText:'2'}).waitFor();
  assert.equal(await page.evaluate(()=>window.__notificationTones),2);
  await page.reload();
  await page.locator('.notification-bell').click();
  await page.getByRole('button',{name:C.notifications.soundOff,exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.__notificationTones),0);
  const modalBox=await page.locator('dialog').boundingBox();
  assert.ok(modalBox.x>=15&&modalBox.x+modalBox.width<=375);
  await page.screenshot({path:'doita-test/notification-inbox-mobile.png'});
  await page.locator('.notification-item').filter({hasText:C.notifications.note}).click();
  await page.waitForURL('**/notes');
  await page.locator('.notification-badge').filter({hasText:'1'}).waitFor();
  await page.locator('.notification-bell').click();
  await page.getByRole('button',{name:C.notifications.markRead,exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.notification-badge'));
  await page.locator('dialog button').filter({hasText:C.common.close}).click();
  console.log('PASS notification badge, real Web Audio tones, mute persistence, no replay on reload and mark-all');
  inboxError=true;
  await page.locator('.notification-bell').click();
  await page.getByText(C.notifications.loadError,{exact:true}).waitFor();
  await page.locator('dialog button').filter({hasText:C.common.close}).click();
  await go('activities');
  await page.getByRole('button',{name:C.activities.choose,exact:true}).click();
  await page.getByRole('button',{name:C.activities.like,exact:true}).click();
  await page.getByText(C.activities.liked,{exact:true}).waitFor();
  assert.equal(await page.getByText(C.errors.refreshFailed,{exact:true}).count(),0);
  inboxError=false;
  await page.locator('.notification-bell').click();
  await page.waitForFunction(()=>!document.querySelector('dialog [role=alert]'));
  await page.locator('dialog button').filter({hasText:C.common.close}).click();
  console.log('PASS notification outage has retry and does not turn a successful like into an error');
  await page.getByRole('button',{name:C.common.openMenu,exact:true}).click();
  assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'),'false');
  console.log('PASS mobile drawer Escape and accessible expanded state');
  await go('memories');
  await page.locator('.memory-open').filter({hasText:'Memory A'}).click();
  await page.locator('dialog button').filter({hasText:C.common.close}).click();
  await page.locator('.memory-open').filter({hasText:'Memory B'}).click();
  await page.locator('dialog').getByText('DETAIL B',{exact:false}).waitFor();
  await page.waitForTimeout(750);
  assert.equal((await page.locator('dialog').innerText()).includes('DETAIL A'),false);
  console.log('PASS delayed memory detail cannot replace newer selection');
  await page.locator('dialog button').filter({hasText:C.common.close}).click();
  tables.prayers.push({id:'40000000-0000-0000-0000-000000000001',couple_id:coupleId,author_id:userId,content:'Archive UX',visibility:'private',status:'released',created_at:new Date().toISOString(),metadata:{resurface:false}});
  for(let i=0;i<35;i++)tables.notes.push({id:`50000000-0000-0000-0000-${String(i).padStart(12,'0')}`,couple_id:coupleId,author_id:userId,title:`UX note ${i}`,content:'Content for scroll preservation',type:i===0?'checklist':'text',is_pinned:false,visibility:'private',created_at:new Date().toISOString()});
  tables.notes.push({id:'55000000-0000-0000-0000-000000000000',couple_id:coupleId,author_id:userId,title:'UX note pinned older',content:'Pinned first across all pages',type:'text',is_pinned:true,visibility:'private',created_at:'2024-01-01T12:00:00Z'});
  tables.note_items.push({id:'55000000-0000-0000-0000-000000000001',note_id:'50000000-0000-0000-0000-000000000000',content:'Paged checklist line',completed:false,position:0});
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(250);
  await go('prayer');
  await page.locator('.prayer-row').filter({hasText:'Archive UX'}).click();
  await page.getByRole('button',{name:C.prayer.archive,exact:true}).click();
  await page.getByText(C.prayer.archiveSaved,{exact:true}).waitFor();
  await page.locator('.filters select').selectOption('archived');
  await page.locator('.prayer-row').filter({hasText:'Archive UX'}).click();
  await page.getByRole('button',{name:C.common.restore,exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('dialog'));
  await page.locator('.filters select').selectOption('all');
  await page.locator('.prayer-row').filter({hasText:'Archive UX'}).click();
  assert.equal(await page.locator('dialog .tag').textContent(),C.common.private);
  await page.locator('dialog button').filter({hasText:C.common.close}).click();
  console.log('PASS archive has a discoverable filter, restore and unchanged private visibility');
  if(await page.locator('.composer').count())await page.locator('.composer').getByRole('button',{name:C.common.close,exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('.boat').first().waitFor();
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    await page.screenshot({path:`doita-test/redesign-evidence/after-prayer-filled-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  await go('notes');
  await page.getByRole('searchbox').fill('UX note');
  await page.locator('.filters select').selectOption('private');
  await page.waitForFunction(()=>document.querySelectorAll('.note-card').length===30);
  assert.equal(await page.locator('.note-card h2').first().textContent(),'UX note pinned older');
  await page.getByRole('button',{name:C.common.more,exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.note-card').length===36);
  await page.getByRole('checkbox',{name:'Paged checklist line',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('input[type=checkbox]')].some(input=>input.checked&&!input.closest('fieldset')?.disabled));
  assert.equal(tables.note_items[0].completed,true);
  console.log('PASS notes pin before pagination; older-page checklist items load and update after Realtime refresh');
  await page.evaluate(()=>window.scrollTo(0,900));
  await page.waitForTimeout(80);
  await go('activities');await page.goBack();
  await page.waitForURL('**/notes');
  await page.waitForFunction(()=>window.scrollY>850,{},{timeout:5000}).catch(async error=>{console.log('Scroll after Back',await page.evaluate(()=>({y:scrollY,state:history.state,height:document.documentElement.scrollHeight})));throw error;});
  assert.equal(await page.getByRole('searchbox').inputValue(),'UX note');
  assert.equal(await page.locator('.filters select').inputValue(),'private');
  assert.ok(await page.evaluate(()=>window.scrollY)>850);
  console.log('PASS Back preserves list scroll, search and filter');
  await page.locator('.letter-preview').filter({hasText:'Content for scroll preservation'}).first().click();
  await page.locator('dialog').getByText('Content for scroll preservation',{exact:true}).waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('dialog'));
  assert.ok(await page.evaluate(()=>document.activeElement.classList.contains('letter-preview')));
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(50);
  await page.screenshot({path:'doita-test/redesign-evidence/after-notes-filled-390.png'});
  console.log('PASS letter reader opens, Escape closes and returns keyboard focus');
  await page.getByRole('button',{name:C.notes.new,exact:true}).first().click();
  await page.locator('.composer input').first().fill('UX form retry');
  await page.locator('.composer textarea').fill('Preserve private draft after lost response');
  await page.locator('.composer select').first().selectOption('checklist');
  await page.locator('.composer select').last().selectOption('private');
  dropNoteResponse=true;
  await page.locator('.composer button[type=submit]').click();
  await page.getByText(C.errors.generic,{exact:true}).waitFor();
  assert.equal(await page.locator('.composer textarea').inputValue(),'Preserve private draft after lost response');
  assert.equal(await page.locator('.composer select').last().inputValue(),'private');
  await page.locator('.composer button[type=submit]').click();
  await page.waitForFunction(()=>!document.querySelector('.composer'));
  assert.equal(noteRequestIds.length,2);assert.equal(noteRequestIds[0],noteRequestIds[1]);
  assert.equal(tables.notes.filter(n=>n.title==='UX form retry').length,1);
  console.log('PASS lost write response retains form; retry reuses request ID without duplicate row');
  await page.getByRole('button',{name:C.notes.new,exact:true}).first().click();
  await page.locator('.composer input').first().fill('UX expired');
  await page.locator('.composer textarea').fill('Keep this draft through session expiry');
  expireSession=true;
  await page.evaluate(({key,session})=>localStorage.setItem(key,JSON.stringify({...session,expires_at:Math.floor(Date.now()/1000)-500})),{key:`sb-${ref}-auth-token`,session});
  await page.locator('.composer button[type=submit]').click();
  await page.getByRole('heading',{name:C.auth.title,exact:true}).waitFor();
  const kept=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),`couple-draft:${userId}:${coupleId}:note:new`);
  assert.equal(kept.body,'Keep this draft through session expiry');assert.equal(kept.visibility,'private');
  expireSession=false;await page.reload();
  await page.locator('.composer textarea').waitFor();
  assert.equal(await page.locator('.composer textarea').inputValue(),'Keep this draft through session expiry');
  await page.locator('.composer button').filter({hasText:C.common.close}).click();
  console.log('PASS expired session retains structured draft for reauthentication');
  const specific={...incoming,read_at:null,id:'60000000-0000-0000-0000-000000000001',kind:'note',url:'/notes?item=30000000-0000-0000-0000-000000000001',created_at:new Date().toISOString()};
  tables.notifications.unshift(specific);emit('notifications',specific);
  await page.locator('.notification-badge').filter({hasText:'1'}).waitFor();
  await page.locator('.notification-bell').click();
  await page.locator('.notification-item').filter({hasText:C.notifications.note}).first().click();
  await page.waitForURL('**/notes?item=*');
  await page.locator('dialog').getByText('UX form retry',{exact:true}).waitFor();
  await page.goBack();await page.waitForURL('**/notes');
  await page.waitForFunction(()=>!document.querySelector('dialog'));
  const missing={...specific,read_at:null,id:'60000000-0000-0000-0000-000000000002',url:'/notes?item=70000000-0000-0000-0000-000000000001',created_at:new Date().toISOString()};
  tables.notifications.unshift(missing);emit('notifications',missing);
  await page.locator('.notification-badge').filter({hasText:'1'}).waitFor();
  await page.locator('.notification-bell').click();
  await page.locator('.notification-item').filter({hasText:C.notifications.note}).first().click();
  await page.getByText(C.common.missingContent,{exact:true}).waitFor();
  await page.getByRole('button',{name:C.common.back,exact:true}).click();
  await page.setViewportSize({width:390,height:420});
  await page.getByRole('button',{name:C.notes.new,exact:true}).first().click();
  await page.locator('.composer textarea').focus();
  await page.locator('.composer button[type=submit]').scrollIntoViewIfNeeded();
  const saveBox=await page.locator('.composer button[type=submit]').boundingBox();
  assert.ok(saveBox.y>=0&&saveBox.y+saveBox.height<=420);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'doita-test/ux-small-viewport.png'});
  await page.locator('.composer button').filter({hasText:C.common.close}).click();
  await page.setViewportSize({width:390,height:844});
  console.log('PASS notification opens specific content; missing content explains access; small viewport keeps submit reachable');
  for (const [kind,path,table,row,label] of [
    ['special','settings','special_dates',{id:'80000000-0000-0000-0000-000000000001',title:'Specific birthday',date:'2000-02-29'},'Specific birthday'],
    ['care','home','moods',{id:'80000000-0000-0000-0000-000000000002',mood:'hug',created_at:new Date().toISOString()},C.moods.hug],
  ]) {
    tables[table].push(row);
    const notice={...specific,read_at:null,id:row.id,kind,url:`/${path}?item=${row.id}`,created_at:new Date().toISOString()};
    tables.notifications.unshift(notice);emit('notifications',notice);
    await page.locator('.notification-badge').filter({hasText:'1'}).waitFor();
    await page.locator('.notification-bell').click();
    await page.locator('.notification-item').filter({hasText:C.notifications[kind]}).first().click();
    await page.locator('dialog').getByText(label,{exact:true}).waitFor();
    await page.locator('dialog').getByRole('button',{name:C.common.back,exact:true}).click();
  }
  console.log('PASS special-date and care notifications open their specific record');
  await page.evaluate(({userId,coupleId})=>{
    localStorage.setItem(`couple-draft:${userId}:${coupleId}:memory`,'Photo draft survives reload');
    localStorage.setItem(`couple-draft:${userId}:${coupleId}:memory-upload`,JSON.stringify({path:`${coupleId}/${userId}/fixture.png`,name:'kept-photo.png'}));
  },{userId,coupleId});
  await go('memories');await page.reload();
  await page.getByRole('button',{name:C.memories.new,exact:true}).first().click();
  assert.equal(await page.locator('.composer textarea').inputValue(),'Photo draft survives reload');
  await page.locator('.composer').getByText(/kept-photo\.png/).waitFor();
  console.log('PASS memory content and uploaded-photo reference survive reload');
  for(let i=0;i<1000;i++)tables.memories.push({id:`90000000-0000-0000-0000-${String(i).padStart(12,'0')}`,couple_id:coupleId,type:'moment',content:`Paged memory ${i}`,created_at:'2025-01-01T12:00:00Z'});
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(350);
  await page.locator('.composer button').filter({hasText:C.common.close}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.memory-card').length===30);
  await page.getByRole('button',{name:C.common.more,exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.memory-card').length===60);
  const memoryTitles=await page.locator('.memory-open').allTextContents();
  assert.equal(new Set(memoryTitles).size,60);
  await page.getByRole('searchbox').fill('Paged memory 0');
  await page.waitForFunction(()=>document.querySelectorAll('.memory-card').length===1);
  await page.locator('.memory-open').getByText('Paged memory 0',{exact:true}).waitFor();
  await page.getByRole('searchbox').fill('');
  console.log('PASS 1000 memories: 30-row pages, duplicate-time cursor without duplicates, server search finds oldest record');
  for(const width of [320,360,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    await page.goto('http://localhost:3100/home');await page.locator('.couple-hero').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
    assert.equal(await page.locator('html').getAttribute('data-theme'),'sunset');
    await page.waitForFunction(()=>[...document.querySelectorAll('img[src^="/themes/"]')].filter(i=>{const box=i.getBoundingClientRect();return box.top<innerHeight&&box.bottom>0;}).every(i=>i.complete&&i.naturalWidth>0));
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://localhost:3100/prayer');await page.locator('.paper-boat').first().waitFor();
  assert.equal(await page.locator('.boat').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});
  console.log('PASS theme assets load, no Home overflow at six widths, reduced-motion retains static accessible boats');
  tables.profiles[0].display_name='A'.repeat(60);
  for(const width of [320,1440])for(const route of ['home','daily','notes','prayer','memories','activities','settings']){
    await page.setViewportSize({width,height:900});await page.goto(`http://localhost:3100/${route}`);
    await page.locator('.bottom-nav').waitFor({state:'attached'});await page.waitForTimeout(150);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} overflow at ${width}`);
  }
  console.log('PASS seven core routes fit narrow mobile and desktop with a 60-character member name');
  await page.setViewportSize({width:390,height:844});
  await go('settings');
  await page.getByRole('button',{name:C.redesign.dates,exact:true}).click();
  await page.getByLabel(C.redesign.eventName,{exact:true}).fill('Custom trip');
  await page.getByLabel(C.common.date,{exact:true}).fill('2020-02-29');
  await page.getByLabel(C.settings.kind,{exact:true}).selectOption('custom');
  await page.getByLabel(C.redesign.customKind,{exact:true}).fill('Our travel day');
  await page.getByLabel(C.redesign.repeat,{exact:true}).selectOption('yearly');
  await page.locator('form').filter({has:page.getByLabel(C.redesign.eventName,{exact:true})}).getByRole('button',{name:C.common.save,exact:true}).click();
  await page.locator('.date-row').filter({hasText:'Custom trip'}).getByText('Our travel day',{exact:false}).waitFor();
  assert.equal(tables.special_dates.find(row=>row.title==='Custom trip').repeat_rule,'yearly');
  console.log('PASS custom date form saves event name, custom kind and explicit yearly recurrence');
  assert.equal(await page.locator('select:disabled').count(),0);
  assert.equal(await page.getByText(C.couples.timezone,{exact:true}).count(),0);
  delayLoad=true;
  await page.getByRole('button',{name:C.redesign.account,exact:true}).click();
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.getByRole('button',{name:C.auth.signOut,exact:true}).click();
  await page.getByRole('heading',{name:C.auth.title,exact:true}).waitFor();
  await page.waitForTimeout(850);
  assert.equal(await page.locator('.bottom-nav').count(),0);
  assert.equal(await page.locator('.mobile-menu').count(),0);
  assert.equal(await page.locator('.notification-bell').count(),0);
  console.log('PASS logout stays cleared after delayed load and auth has no empty menu');
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.locator('.auth-art p').evaluate(el=>getComputedStyle(el).color),await page.locator('.auth-art').evaluate(el=>getComputedStyle(el).color));
    await page.waitForFunction(()=>[...document.querySelectorAll('.auth-art img')].every(el=>!el.getBoundingClientRect().width||(el.complete&&el.naturalWidth>0)));
    await page.screenshot({path:`doita-test/redesign-evidence/after-auth-${width}.png`,fullPage:true});
  }
  // Start an independent fixture session with a failing membership request.
  membershipError=true;delayLoad=false;
  await page.evaluate(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${ref}-auth-token`,session});
  await page.reload();
  await page.getByText(C.errors.loadFailed,{exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:C.couples.title,exact:true}).count(),0);
  console.log('PASS membership failure shows retry instead of pairing screen');
  assert.deepEqual(failures,[]);
} catch (error) {
  console.log('Fixture page at failure:', page.url(), (await page.locator('body').innerText()).slice(-2200));
  console.log('Browser errors:',failures);
  console.log('Bell fixture at failure:',await page.locator('.notification-bell').count()?await page.locator('.notification-bell').evaluate(el=>el.outerHTML):'absent');
  throw error;
} finally { await browser.close(); }
