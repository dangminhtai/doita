import { test } from "node:test";
import assert from "node:assert/strict";
import { LatestRequest } from "../src/lib/latest-request";

test("Realtime superseding mutation refresh reports the newest successful result", async () => {
  const requests = new LatestRequest<boolean>();
  let finish!: (value: boolean) => void;
  const old = requests.run(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const current = requests.run(async () => true);
  finish(false);
  assert.equal(await old, true);
  assert.equal(await current, true);
});

test("a genuinely failed latest refresh remains a failure", async () => {
  const requests = new LatestRequest<boolean>();
  let finish!: (value: boolean) => void;
  const old = requests.run(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await requests.run(async () => false);
  finish(true);
  assert.equal(await old, false);
  assert.equal(await requests.run(async () => true), true);
});

test("superseded exceptions follow the latest request without swallowing current exceptions", async () => {
  const requests = new LatestRequest<boolean>();
  let fail!: (error: Error) => void;
  const old = requests.run(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      }),
  );
  await requests.run(async () => true);
  fail(new Error("old request"));
  assert.equal(await old, true);
  await assert.rejects(
    requests.run(async () => {
      throw new Error("current request");
    }),
    /current request/,
  );
});
