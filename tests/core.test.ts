import { test } from "node:test";
import assert from "node:assert/strict";
import { localDate, nextStreak, canRepair, dayGap } from "../src/lib/date";
import { interpolate, CONTENT } from "../src/config/content.vi";
import { recommend, type Activity } from "../src/features/activities/recommend";
import activities from "../data/activities.json";
import {
  noteSchema,
  prayerSchema,
  inviteSchema,
} from "../src/features/schemas";
test("streak same day, consecutive days and gaps", () => {
  assert.equal(nextStreak(4, "2026-10-03", "2026-10-04"), 5);
  assert.equal(nextStreak(4, "2026-10-04", "2026-10-04"), 4);
  assert.equal(nextStreak(4, "2026-10-01", "2026-10-04"), 1);
  assert.equal(nextStreak(0, null, "2026-10-04"), 1);
  assert.equal(dayGap("2026-03-01", "2026-02-28"), 1);
});
test("repair only bridges exactly one missed day with available token", () => {
  assert.equal(canRepair("2026-10-02", "2026-10-04", 1), true);
  assert.equal(canRepair("2026-10-01", "2026-10-04", 2), false);
  assert.equal(canRepair("2026-10-02", "2026-10-04", 0), false);
});
test("couple timezone determines date even across midnight and DST", () => {
  const now = new Date("2026-10-03T20:00:00Z");
  assert.equal(localDate(now, "Asia/Ho_Chi_Minh"), "2026-10-04");
  assert.equal(localDate(now, "America/Los_Angeles"), "2026-10-03");
  assert.equal(dayGap("2026-03-09", "2026-03-08"), 1);
});
test("interpolated config text and literal replacements", () => {
  assert.equal(
    interpolate(CONTENT.home.streak, { count: 12 }),
    "12 ngày kết nối",
  );
  assert.equal(interpolate("{{name}}", { name: "$&" }), "$&");
});
test("100 activities filter time, energy, preference and avoid repeats", () => {
  assert.equal(activities.length, 100);
  assert.equal(new Set(activities.map((a) => a.id)).size, 100);
  const pool = recommend(activities as Activity[], 5, "low", "chat");
  assert.ok(pool.length > 0);
  assert.ok(
    pool.every(
      (x) => x.duration <= 5 && x.energy === "low" && x.category === "chat",
    ),
  );
  const next = recommend(activities as Activity[], 5, "low", "chat", [
    pool[0].id,
  ]);
  assert.ok(!next.some((x) => x.id === pool[0].id));
});
test("validation rejects empty and oversized notes, prayers, wrong visibility and malformed code", () => {
  assert.equal(
    noteSchema.safeParse({
      title: "a",
      content: " ",
      type: "text",
      visibility: "private",
    }).success,
    false,
  );
  assert.equal(
    prayerSchema.safeParse({
      content: "x".repeat(1001),
      visibility: "partner",
      resurface: true,
    }).success,
    false,
  );
  assert.equal(
    prayerSchema.safeParse({
      content: "a",
      visibility: "public",
      resurface: true,
    }).success,
    false,
  );
  assert.equal(inviteSchema.safeParse("a".repeat(24)).success, true);
  assert.equal(inviteSchema.safeParse("1234").success, false);
});
