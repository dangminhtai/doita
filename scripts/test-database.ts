// Execute the production migration against real PostgreSQL (PGlite).
// Only Supabase service schemas/roles and pgcrypto random bytes are shimmed.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
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
await one(`select public.answer_daily('answer A')`);
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
await one(`select public.answer_daily('answer B')`);
assert.equal(
  (await db.query("select * from public.daily_answers")).rows.length,
  2,
);
assert.equal(
  (await one("select current_streak from public.streaks")).current_streak,
  1,
);
await one(`select public.answer_daily('duplicate')`);
assert.equal(
  (await one("select current_streak from public.streaks")).current_streak,
  1,
);
console.log(
  "PASS daily hidden before reveal, atomic completion, idempotent streak",
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
await one("select public.leave_couple()");
for (const table of [
  "couples",
  "notes",
  "prayers",
  "daily_answers",
  "memories",
  "moods",
])
  assert.equal(
    (await db.query(`select * from public.${table}`)).rows.length,
    0,
  );
await denied(`select public.set_mood('happy')`);
console.log("PASS leave revokes read/write access");
await db.close();
console.log("Database integration suite passed.");
