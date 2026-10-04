// Execute the production migration against real PostgreSQL (PGlite).
// Only Supabase service schemas/roles and pgcrypto random bytes are shimmed.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`
create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema storage;create schema extensions;
create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;
create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
create function extensions.gen_random_bytes(integer) returns bytea language sql volatile as $$select decode(string_agg(md5(random()::text),''),'hex') from generate_series(1,ceil($1::numeric/16)::int)$$;
create publication supabase_realtime;
alter default privileges in schema public grant all on tables to service_role;
`);
const migration = readFileSync(
  "supabase/migrations/202610040001_core.sql",
  "utf8",
).replace(
  "create extension if not exists pgcrypto with schema extensions;",
  "",
);
// Test shim must produce the exact number of requested random bytes.
await db.exec(
  `create or replace function extensions.gen_random_bytes(integer) returns bytea language sql volatile as $$select substring(decode(string_agg(md5(random()::text),''),'hex') from 1 for $1) from generate_series(1,ceil($1::numeric/16)::int)$$;`,
);
await db.exec(migration);
for (const file of readdirSync("supabase/migrations")
  .filter((file) => file.endsWith(".sql") && file !== "202610040001_core.sql")
  .sort()) {
  await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
}
await db.exec(readFileSync("supabase/seed.sql", "utf8"));
const A = "00000000-0000-0000-0000-000000000001",
  B = "00000000-0000-0000-0000-000000000002",
  C = "00000000-0000-0000-0000-000000000003",
  D = "00000000-0000-0000-0000-000000000004";
for (const [id, name] of [
  [A, "A"],
  [B, "B"],
  [C, "C"],
  [D, "D"],
])
  await db.query(
    `insert into auth.users(id,raw_user_meta_data) values($1,jsonb_build_object('display_name',$2::text))`,
    [id, name],
  );
async function as(id: string | null, role = "authenticated") {
  await db.exec(
    `reset role;select set_config('request.jwt.claim.sub','${id ?? ""}',false);set role ${role};`,
  );
}
async function one(sql: string, args: any[] = []): Promise<any> {
  return (await db.query(sql, args)).rows[0];
}
async function denied(sql: string, args: any[] = []) {
  await assert.rejects(db.query(sql, args));
}
await as(A);
const { id: cid } = await one(
  `select public.pair_couple(null,'Asia/Ho_Chi_Minh') as id`,
);
const { invite_code: code } = await one(
  "select invite_code from public.couples",
);
assert.equal(code.length, 24);
console.log("PASS create couple, profile trigger, random invite");
await as(B);
assert.equal(
  (await one("select public.pair_couple($1) as id", [code])).id,
  cid,
);
await as(C);
assert.equal(
  (await one("select public.pair_couple($1) as id", [code])).id,
  null,
);
assert.equal((await db.query("select * from public.couples")).rows.length, 0);
console.log("PASS third user cannot join or read couple");
await as(D);
for (let i = 0; i < 11; i++)
  await one("select public.pair_couple($1) as id", ["b".repeat(24)]);
await as(A);
const fresh = (await one("select public.rotate_invite() as code")).code;
await as(D);
assert.equal(
  (await one("select public.pair_couple($1) as id", [fresh])).id,
  null,
);
console.log("PASS invite attempt limiter persists across invalid codes");
await as(A);
const requestId = "20000000-0000-0000-0000-000000000001";
const requestArgs = {
  p_title: "UX retry",
  p_content: "one saved note",
  p_type: "text",
  p_visibility: "private",
};
const firstReceipt = await one(
  "select public.perform_authorized_action('save_note',$1::jsonb,$2) as id",
  [JSON.stringify(requestArgs), requestId],
);
const retriedReceipt = await one(
  "select public.perform_authorized_action('save_note',$1::jsonb,$2) as id",
  [JSON.stringify(requestArgs), requestId],
);
assert.equal(firstReceipt.id, retriedReceipt.id);
assert.equal(
  (
    await one(
      "select count(*)::int as n from public.notes where title='UX retry'",
    )
  ).n,
  1,
);
await denied(
  "select public.perform_authorized_action('save_note',$1::jsonb,$2)",
  [JSON.stringify({ ...requestArgs, p_content: "changed" }), requestId],
);
await denied(
  "select public.perform_authorized_action('daily_maintenance','{}',$1)",
  ["20000000-0000-0000-0000-000000000002"],
);
await denied("select * from private.action_receipts");
await one(
  "select public.perform_authorized_action('set_mood','{\"p_mood\":\"calm\"}',$1)",
  ["20000000-0000-0000-0000-000000000003"],
);
await one(
  "select public.perform_authorized_action('set_mood','{\"p_mood\":\"calm\"}',$1)",
  ["20000000-0000-0000-0000-000000000003"],
);
assert.equal(
  (await one("select count(*)::int as n from public.moods where mood='calm'"))
    .n,
  1,
);
console.log(
  "PASS retry receipts return original result, no duplicate writes, no privileged dispatch",
);
const privateNote = (
  await one(
    `select public.save_note('private','secret','text','private') as id`,
  )
).id;
const sharedNote = (
  await one(
    `select public.save_note('shared',E'one\\ntwo','checklist','couple') as id`,
  )
).id;
const privatePrayer = (
  await one(`select public.save_prayer('secret prayer','private',true) as id`)
).id;
await one(`select public.save_prayer('shared prayer','partner',true)`);
await as(B);
assert.equal(
  (await db.query("select * from public.notes where id=$1", [privateNote])).rows
    .length,
  0,
);
assert.equal(
  (await db.query("select * from public.prayers where id=$1", [privatePrayer]))
    .rows.length,
  0,
);
assert.equal(
  (await db.query("select * from public.notes where id=$1", [sharedNote])).rows
    .length,
  1,
);
await denied(`select public.note_action($1,'delete')`, [privateNote]);
const item = (await one("select id from public.note_items limit 1")).id;
await one("select public.toggle_note_item($1)", [item]);
assert.equal(
  (await one("select completed from public.note_items where id=$1", [item]))
    .completed,
  true,
);
console.log("PASS private note/prayer isolation, shared checklist edit");

await as(A);
const checklist = (
  await one(
    "select public.save_note('checklist', $1, 'checklist', 'couple') as id",
    ["one\ntwo\none"],
  )
).id;
const before = (
  await db.query(
    "select id,content,position from public.note_items where note_id=$1 order by position",
    [checklist],
  )
).rows as any[];
await one("select public.toggle_note_item($1)", [before[0].id]);
await one(
  "select public.save_note('renamed', $1, 'checklist', 'private', $2)",
  ["one\ntwo\none", checklist],
);
assert.equal(
  (
    await one("select completed from public.note_items where id=$1", [
      before[0].id,
    ])
  ).completed,
  true,
);
assert.deepEqual(
  (
    await db.query(
      "select id from public.note_items where note_id=$1 order by position",
      [checklist],
    )
  ).rows.map((r: any) => r.id),
  before.map((r) => r.id),
);
await one(
  "select public.save_note('renamed', $1, 'checklist', 'private', $2)",
  ["new\none\ntwo\none", checklist],
);
assert.equal(
  (
    await one("select completed from public.note_items where id=$1", [
      before[0].id,
    ])
  ).completed,
  true,
);
await one(
  "select public.save_note('renamed', $1, 'checklist', 'private', $2)",
  ["two changed\none", checklist],
);
assert.equal(
  (
    await one("select completed from public.note_items where id=$1", [
      before[0].id,
    ])
  ).completed,
  true,
);
assert.equal(
  (
    await db.query("select id from public.note_items where id=$1", [
      before[1].id,
    ])
  ).rows.length,
  0,
);
assert.equal(
  (
    await db.query("select id from public.note_items where note_id=$1", [
      checklist,
    ])
  ).rows.length,
  2,
);
await as(B);
await denied(
  "select public.save_note('unauthorized','x','checklist','couple',$1)",
  [checklist],
);
await as(A);
console.log(
  "PASS checklist metadata, insertion, deletion, edited lines, duplicate lines and ownership",
);
await db.query(
  "select public.save_note('now private','no shared copy','text','private',$1)",
  [sharedNote],
);
await as(B);
assert.equal(
  (
    await db.query("select * from public.memories where source_id=$1", [
      sharedNote,
    ])
  ).rows.length,
  0,
);
console.log("PASS note visibility change removes shared memory reference");

await as(A);
const draftPrayer = (
  await one(
    "select public.save_prayer('private draft','private',false,'draft') as id",
  )
).id;
assert.equal(
  (await one("select metadata from public.prayers where id=$1", [draftPrayer]))
    .metadata.resurface,
  false,
);
await one(
  "select public.save_prayer('private draft','private',false,'released',$1)",
  [draftPrayer],
);
assert.equal(
  (
    await one("select resurface_at from public.prayers where id=$1", [
      draftPrayer,
    ])
  ).resurface_at,
  null,
);
const currentDaily = (await one("select public.ensure_daily() as id")).id;
await one("select public.prayer_action($1,'archive')", [draftPrayer]);
assert.equal(
  (await one("select status from public.prayers where id=$1", [draftPrayer]))
    .status,
  "archived",
);
await one("select public.prayer_action($1,'restore')", [draftPrayer]);
assert.equal(
  (await one("select status from public.prayers where id=$1", [draftPrayer]))
    .status,
  "released",
);
assert.equal(
  (
    await one("select visibility from public.prayers where id=$1", [
      draftPrayer,
    ])
  ).visibility,
  "private",
);
console.log("PASS archive and restore preserve prayer visibility");
await denied("select public.answer_daily('missing session')");
await db.exec("reset role");
const oldDaily = (
  await one(
    "insert into public.daily_sessions(couple_id,prompt_id,date) select $1,prompt_id,date-1 from public.daily_sessions where id=$2 returning id",
    [cid, currentDaily],
  )
).id;
await as(A);
await denied("select public.answer_daily('stale content',$1)", [oldDaily]);
assert.equal(
  (
    await db.query("select * from public.daily_answers where session_id=$1", [
      currentDaily,
    ])
  ).rows.length,
  0,
);
console.log(
  "PASS prayer resurface intention and stale/missing daily session rejection",
);
await db.exec("reset role");
const oldMemory = (
  await one(
    "insert into public.memories(couple_id,author_id,type,content,created_at) values($1,$2,'moment','old memory',now()-interval '1 year') returning id",
    [cid, A],
  )
).id;
await db.query(
  "insert into public.memories(couple_id,author_id,type,content) select $1,$2,'moment','new memory' from generate_series(1,35)",
  [cid, A],
);
await as(A);
assert.ok(
  (await db.query("select id from public.memories_on_this_day()")).rows.some(
    (r: any) => r.id === oldMemory,
  ),
);
assert.ok(
  !(
    await db.query(
      "select id from public.memories order by created_at desc limit 30",
    )
  ).rows.some((r: any) => r.id === oldMemory),
);
await as(C);
assert.equal(
  (await db.query("select * from public.memories_on_this_day()")).rows.length,
  0,
);
await as(A);
console.log(
  "PASS anniversary query independent of pagination and protected by RLS",
);

await as(A);
await one(`select public.answer_daily('answer A',public.ensure_daily())`);
assert.equal(
  (await db.query("select * from public.daily_answers")).rows.length,
  1,
);
await as(B);
assert.equal(
  (await db.query("select * from public.daily_answers")).rows.length,
  0,
);
await denied(
  `insert into public.daily_answers(session_id,user_id,content) select id,auth.uid(),'bypass' from public.daily_sessions`,
);
await one(`select public.answer_daily('answer B',public.ensure_daily())`);
assert.equal(
  (await db.query("select * from public.daily_answers")).rows.length,
  2,
);
assert.equal(
  (await one("select current_streak from public.streaks")).current_streak,
  1,
);
await one(`select public.answer_daily('duplicate',public.ensure_daily())`);
assert.equal(
  (await one("select current_streak from public.streaks")).current_streak,
  1,
);
console.log(
  "PASS daily hidden before reveal, atomic completion, idempotent streak",
);
await as(A);
await one("select public.daily_reply(public.ensure_daily(),'♥')");
assert.equal(
  (await db.query("select * from public.notifications where kind='reaction'"))
    .rows.length,
  0,
);
await as(B);
const reactionNotice = await one(
  "select * from public.notifications where kind='reaction'",
);
assert.equal(reactionNotice.user_id, B);
assert.equal(reactionNotice.actor_id, A);
assert.ok(reactionNotice.url.startsWith("/daily?item="));
assert.equal(reactionNotice.read_at, null);
await as(A);
await one("select public.mark_notifications_read($1::uuid[])", [
  [reactionNotice.id],
]);
await as(B);
assert.equal(
  (
    await one("select read_at from public.notifications where id=$1", [
      reactionNotice.id,
    ])
  ).read_at,
  null,
);
await one("select public.mark_notifications_read($1::uuid[])", [
  [reactionNotice.id],
]);
assert.ok(
  (
    await one("select read_at from public.notifications where id=$1", [
      reactionNotice.id,
    ])
  ).read_at,
);
await denied("update public.notifications set read_at=null");
await as(C);
assert.equal(
  (await db.query("select * from public.notifications")).rows.length,
  0,
);
await as(A);
await one(
  "select public.log_activity((select id from public.activities limit 1),1)",
);
await as(B);
assert.equal(
  (
    await one(
      "select actor_id from public.notifications where kind='activity_like'",
    )
  ).actor_id,
  A,
);
await one("select public.mark_notifications_read(p_before=>now())");
assert.equal(
  (
    await one(
      "select count(*)::int as n from public.notifications where read_at is null",
    )
  ).n,
  0,
);
console.log(
  "PASS inbox recipient isolation, hearts/likes, own-only read and mark-all",
);
await denied("select public.daily_maintenance()");
await denied("select public.claim_notifications()");
console.log("PASS service-only cron and push claim");
await as(null, "service_role");
await one("select public.daily_maintenance()");
const count = (
  await one("select count(*)::int as n from public.notification_outbox")
).n;
await one("select public.daily_maintenance()");
assert.equal(
  (await one("select count(*)::int as n from public.notification_outbox")).n,
  count,
);
const claim = (await db.query("select * from public.claim_notifications()"))
  .rows;
assert.ok(claim.length > 0);
assert.equal(
  (await db.query("select * from public.claim_notifications()")).rows.length,
  0,
);
console.log("PASS cron deduplication and notification lease");
await db.exec("reset role");
await db.query(
  `update public.prayers set resurface_at=now()-interval '1 day' where id=$1`,
  [privatePrayer],
);
await as(null, "service_role");
await one("select public.daily_maintenance()");
assert.equal(
  (
    await db.query(`select * from public.memories where source_id=$1`, [
      privatePrayer,
    ])
  ).rows.length,
  0,
);
console.log("PASS private resurfacing never becomes shared memory");
await db.exec("reset role");
await db.query(
  `update public.streaks set current_streak=7,last_completed_date=(now() at time zone 'Asia/Ho_Chi_Minh')::date-2,repair_tokens=1 where couple_id=$1`,
  [cid],
);
await as(A);
await one("select public.repair_streak()");
assert.equal(
  (await one("select repair_tokens from public.streaks")).repair_tokens,
  0,
);
assert.equal(
  (await one("select current_streak from public.streaks")).current_streak,
  7,
);
await denied("select public.repair_streak()");
console.log("PASS repair eligibility, token consumption, no double repair");
await as(B);
await db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
  "memories",
  `${cid}/${B}/photo.png`,
]);
await as(C);
assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
await denied("insert into storage.objects(bucket_id,name) values($1,$2)", [
  "memories",
  `${cid}/${C}/bad.png`,
]);
console.log("PASS private storage policies");
await as(B);
const photoMemory = (
  await one("select public.save_memory('asset tracking',$1) as id", [
    `${cid}/${B}/photo.png`,
  ])
).id;
await one("select public.delete_memory($1)", [photoMemory]);
await db.exec("reset role");
assert.equal(
  (
    await one("select cleanup from public.memory_assets where path=$1", [
      `${cid}/${B}/photo.png`,
    ])
  ).cleanup,
  true,
);
assert.ok(
  (
    await db.query(
      "select tablename from pg_publication_tables where pubname='supabase_realtime'",
    )
  ).rows.some((r: any) => r.tablename === "special_dates"),
);
console.log(
  "PASS durable photo cleanup after deleting memory and Realtime publication",
);
await db.query(
  "insert into public.memory_assets(path,user_id,created_at) values($1,$2,now()-interval '2 days')",
  [`${cid}/${B}/abandoned.png`, B],
);
await db.query("insert into public.memory_assets(path,user_id) values($1,$2)", [
  `${cid}/${B}/uploading.png`,
  B,
]);
await db.exec("select public.queue_abandoned_assets()");
assert.equal(
  (
    await one("select cleanup from public.memory_assets where path=$1", [
      `${cid}/${B}/abandoned.png`,
    ])
  ).cleanup,
  true,
);
assert.equal(
  (
    await one("select cleanup from public.memory_assets where path=$1", [
      `${cid}/${B}/uploading.png`,
    ])
  ).cleanup,
  false,
);
await as(B);
await denied("select public.queue_abandoned_assets()");
console.log(
  "PASS abandoned upload recovery waits 24 hours and is service-only",
);
await as(B);
await one("select public.leave_couple()");
for (const table of [
  "couples",
  "notes",
  "prayers",
  "daily_answers",
  "memories",
  "moods",
  "notifications",
])
  assert.equal(
    (await db.query(`select * from public.${table}`)).rows.length,
    0,
  );
await denied(`select public.set_mood('happy')`);
console.log("PASS leave revokes read/write access");
await db.exec("reset role");
assert.equal(
  (
    await one("select user_id from public.memory_assets where path=$1", [
      `${cid}/${B}/photo.png`,
    ])
  ).user_id,
  B,
);
await as(C);
await denied("select * from public.memory_assets");
await denied("select public.queue_memory_cleanup($1)", [
  `${cid}/${B}/photo.png`,
]);
console.log(
  "PASS old-couple assets remain traceable and registry has no client access",
);
await db.close();
console.log("Database integration suite passed.");
