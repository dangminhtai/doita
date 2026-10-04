import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyPrayerDraft,
  parsePrayerDraft,
  prayerDraftKey,
} from "../src/features/prayer/draft";
import { actionErrorMessage } from "../src/lib/action-error";
import { CONTENT as C } from "../src/config/content.vi";
import { nextOccurrence } from "../src/lib/date";
import { processWithinBudget } from "../src/lib/notifications/worker";
test("prayer draft preserves private/resurface false/edit identity across serialization", () => {
  const d = {
    body: "secret",
    visibility: "private" as const,
    resurface: false,
    draftId: "draft-id",
  };
  assert.deepEqual(parsePrayerDraft(JSON.stringify(d)), d);
  assert.equal(emptyPrayerDraft().visibility, "private");
  assert.notEqual(
    prayerDraftKey("a", "c", null),
    prayerDraftKey("a", "c", "draft-id"),
  );
  assert.notEqual(
    prayerDraftKey("a", "c", null),
    prayerDraftKey("a", "other", null),
  );
  assert.equal(parsePrayerDraft(JSON.stringify({ body: "secret" })), null);
});
test("business errors are actionable and arbitrary server details stay hidden", () => {
  assert.equal(
    actionErrorMessage({ code: "P0001", message: "stale_session" }),
    C.errors.staleDaily,
  );
  assert.equal(
    actionErrorMessage({ code: "P0001", message: "repair_unavailable" }),
    C.errors.repair,
  );
  assert.equal(
    actionErrorMessage({ code: "P0001", message: "forbidden" }),
    C.errors.forbidden,
  );
  assert.equal(
    actionErrorMessage({ code: "P0001", message: "private database detail" }),
    C.errors.generic,
  );
});
test("recurring birthdays, anniversaries, leap days and one-off events", () => {
  assert.equal(
    nextOccurrence("1998-10-05", "birthday", "2026-10-04"),
    "2026-10-05",
  );
  assert.equal(
    nextOccurrence("2020-09-01", "anniversary", "2026-10-04"),
    "2027-09-01",
  );
  assert.equal(
    nextOccurrence("2000-02-29", "birthday", "2026-10-04"),
    "2028-02-29",
  );
  assert.equal(nextOccurrence("2025-10-05", "meetup", "2026-10-04"), null);
});
test("worker drains more than 50 jobs with bounded concurrency and stops at deadline", async () => {
  let active = 0,
    peak = 0;
  const done: number[] = [];
  const processed = await processWithinBudget(
    Array.from({ length: 81 }, (_, i) => i),
    async (i) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      done.push(i);
      active--;
    },
    100,
    5,
    () => 0,
  );
  assert.equal(processed, 81);
  assert.equal(new Set(done).size, 81);
  assert.ok(peak <= 5);
  assert.equal(
    await processWithinBudget(
      [1],
      async () => {
        throw new Error("unexpected");
      },
      10,
      5,
      () => 11,
    ),
    0,
  );
});
test("worker waits for in-flight tasks before surfacing acknowledgement failure", async () => {
  let finished = false;
  await assert.rejects(
    processWithinBudget(
      [1, 2, 3],
      async (i) => {
        if (i === 1) throw new Error("ack");
        await Promise.resolve();
        finished = true;
      },
      100,
      2,
      () => 0,
    ),
  );
  assert.equal(finished, true);
});
