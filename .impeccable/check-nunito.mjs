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
  return route.fulfill({status:200,headers:{'content-range':`0-0/${total}`,'access-control-expose-headers':'content-range','access-control-allow-origin':'http://localhost:3000'},json:isSingle?(rows[0]??null):rows});
});
await context.addInitScript(()=>{
  window.__autoConfirm=true;
  const observe=()=>new MutationObserver(()=>{
    if(window.__autoConfirm)document.querySelector('dialog[role="alertdialog"] .confirmation-actions button:last-child')?.click();
  }).observe(document.body,{childList:true,subtree:true});
  if(document.body)observe();else addEventListener('DOMContentLoaded',observe,{once:true});
});
const page=await context.newPage();
page.on('dialog',dialog=>dialog.accept());
const pick=async(trigger,value)=>{await trigger.click();await page.locator(`.doita-select-option[data-value="${value}"]`).click();};
const settleVisual=()=>page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
const failures=[];
page.on('pageerror',error=>failures.push(error.message));
const go=async id=>{const item=page.locator(`.bottom-nav a[href="/${id}"]`);if(await item.count())await item.click();else {const box=await page.locator('.mobile-menu').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.locator(`.sidebar a[href="/${id}"]`).click();}};
try {
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  for(const route of ['home','notes','prayer','memories','activities','settings']){
   await page.goto('http://localhost:3000/'+route);await page.locator('.bottom-nav').waitFor({state:'attached'});
   const v=await page.evaluate(async()=>{await document.fonts.ready;const body=getComputedStyle(document.body);await document.fonts.load('400 16px '+body.fontFamily,'Đặng Minh Tài — lời nhắn người ấy');const h=getComputedStyle(document.querySelector('h1'));return {family:body.fontFamily,size:body.fontSize,weight:body.fontWeight,line:body.lineHeight,title:h.fontWeight,loaded:document.fonts.check('400 16px '+body.fontFamily,'Đặng Minh Tài — lời nhắn người ấy'),overflow:document.documentElement.scrollWidth>innerWidth+1}});
   assert.ok(v.family.includes('Nunito'));assert.equal(v.size,'16px');assert.equal(v.weight,'400');assert.equal(v.line,'25.6px');assert.equal(v.title,'800');assert.equal(v.loaded,true);assert.equal(v.overflow,false);
  }
  console.log('PASS Nunito loaded incl Vietnamese, 400/16/1.6, title800; six routes fit '+width);
 }
}finally{await browser.close();}
