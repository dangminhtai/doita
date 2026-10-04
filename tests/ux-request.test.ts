import { test } from "node:test";
import assert from "node:assert/strict";
import { boundedFetch, uncertainWrite } from "../src/lib/request";
test("network timeout ends waiting and retains uncertainty of a write", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_input, init) =>
    new Promise((_, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("aborted", "AbortError")),
        { once: true },
      );
    });
  try {
    await assert.rejects(
      boundedFetch("https://fixture.invalid", {}, 5),
      /request_timeout/,
    );
    assert.equal(uncertainWrite(new Error("request_timeout")), true);
    assert.equal(uncertainWrite({ message: "invalid", code: "P0001" }), false);
  } finally {
    globalThis.fetch = original;
  }
});
