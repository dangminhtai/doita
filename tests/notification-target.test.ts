import { test } from "node:test";
import assert from "node:assert/strict";
import { notificationTarget } from "../src/lib/notifications/target";

test("old couple notification links use the new route and preserve their target", () => {
  assert.equal(notificationTarget("/settings"), "/couple");
  assert.equal(
    notificationTarget("/settings?panel=dates&open=abc#date"),
    "/couple?panel=dates&open=abc#date",
  );
  for (const target of [
    "/couple",
    "/profile",
    "/settings-other",
    "/settings/nested",
    "https://example.com/settings",
  ]) {
    assert.equal(notificationTarget(target), target);
  }
});
