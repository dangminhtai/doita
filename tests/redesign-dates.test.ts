import { test } from "node:test";
import assert from "node:assert/strict";
import { dayBoundary, nextOccurrence } from "../src/lib/date";

test("calendar search bounds follow couple timezone across DST", () => {
  assert.equal(
    dayBoundary("2026-10-05", "Asia/Ho_Chi_Minh"),
    "2026-10-04T17:00:00.000Z",
  );
  const start = Date.parse(dayBoundary("2026-03-08", "America/Los_Angeles"));
  const end = Date.parse(dayBoundary("2026-03-09", "America/Los_Angeles"));
  assert.equal((end - start) / 3600000, 23);
});
test("explicit recurrence overrides kind and custom leap dates skip invalid years", () => {
  assert.equal(
    nextOccurrence("2000-10-05", "birthday", "2026-10-05", "none"),
    null,
  );
  assert.equal(
    nextOccurrence("2020-02-29", "custom", "2026-10-05", "yearly"),
    "2028-02-29",
  );
  assert.equal(
    nextOccurrence("2020-10-04", "custom", "2026-10-05", "yearly"),
    "2027-10-04",
  );
  assert.equal(
    nextOccurrence("2026-10-05", "custom", "2026-10-05", "none"),
    "2026-10-05",
  );
});
