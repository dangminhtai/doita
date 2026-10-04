import { test } from "node:test";
import assert from "node:assert/strict";
import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { actionErrorMessage } from "../src/lib/action-error";
import { CONTENT as C } from "../src/config/content.vi";

test("invalid credentials explain how to register without claiming the user is absent", () => {
  const message = actionErrorMessage(
    new AuthApiError("Invalid login credentials", 400, "invalid_credentials"),
  );
  assert.equal(message, C.errors.credentials);
  assert.match(message, /Nếu chưa có tài khoản/);
});

test("confirmation delivery errors take priority over retryable server errors", () => {
  assert.equal(
    actionErrorMessage(
      new AuthRetryableFetchError("Error sending confirmation email", 500),
    ),
    C.errors.emailDelivery,
  );
  assert.equal(
    actionErrorMessage(new AuthRetryableFetchError("Failed to fetch", 0)),
    C.errors.authConnection,
  );
  assert.equal(
    actionErrorMessage(new AuthRetryableFetchError("Service unavailable", 503)),
    C.errors.authUnavailable,
  );
});

test("specific Auth codes remain actionable and unknown errors do not leak server text", () => {
  assert.equal(
    actionErrorMessage(
      new AuthApiError("hidden detail", 400, "email_not_confirmed"),
    ),
    C.errors.emailNotConfirmed,
  );
  assert.equal(
    actionErrorMessage(
      new AuthApiError("hidden detail", 429, "over_email_send_rate_limit"),
    ),
    C.errors.emailRate,
  );
  assert.equal(
    actionErrorMessage(
      new AuthApiError("hidden detail", 400, "email_provider_disabled"),
    ),
    C.errors.emailDisabled,
  );
  assert.equal(
    actionErrorMessage(new AuthApiError("hidden detail", 500, undefined)),
    C.errors.auth,
  );
  assert.equal(
    actionErrorMessage(new Error("private server detail")),
    C.errors.generic,
  );
});
