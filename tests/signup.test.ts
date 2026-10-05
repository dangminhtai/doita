import { test } from "node:test";
import assert from "node:assert/strict";
import { signupSchema, authSchema } from "../src/features/schemas";

test("signup requires an explicit gender choice and a nonblank name; login remains unchanged", () => {
  const input = {
    email: "test@example.com",
    password: "password123",
    name: "Tài",
  };
  for (const gender of [undefined, null, "", "unset", "invalid"]) {
    assert.equal(signupSchema.safeParse({ ...input, gender }).success, false);
  }
  for (const gender of ["male", "female", "other", "undisclosed"]) {
    assert.equal(signupSchema.safeParse({ ...input, gender }).success, true);
  }
  assert.equal(
    signupSchema.safeParse({ ...input, name: " ", gender: "male" }).success,
    false,
  );
  assert.equal(authSchema.safeParse({ ...input, name: "" }).success, true);
});
