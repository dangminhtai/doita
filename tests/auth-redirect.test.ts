import { test } from "node:test";
import assert from "node:assert/strict";
import { authRedirectUrl } from "../src/lib/auth-redirect";
test("email callbacks follow the actual local or production origin", () => {
  assert.equal(authRedirectUrl("http://localhost:3000"), "http://localhost:3000/auth");
  assert.equal(authRedirectUrl("http://127.0.0.1:3000"), "http://127.0.0.1:3000/auth");
  assert.equal(authRedirectUrl("https://doita.vercel.app"), "https://doita.vercel.app/auth");
});
