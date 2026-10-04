import { isAuthError } from "@supabase/supabase-js";
import { CONTENT as C } from "../config/content.vi";

export function actionErrorMessage(error: unknown): string {
  if (!isAuthError(error)) {
    if (typeof error === "object" && error !== null && "message" in error) {
      if (String(error.message).includes("request_timeout"))
        return C.errors.timeout;
      const messages: Record<string, string> = {
        request_timeout: C.errors.timeout,
        session_expired: C.errors.authExpired,
        forbidden: C.errors.forbidden,
        repair_unavailable: C.errors.repair,
        stale_session: C.errors.staleDaily,
        not_paired: C.errors.notPaired,
        seed_required: C.errors.unavailable,
        invalid: C.errors.invalid,
        "invalid invite": C.errors.invite,
        "Invalid file": C.errors.invalidFile,
        push_not_ready: C.errors.pushNotReady,
      };
      if ("code" in error && error.code === "PGRST205")
        return C.errors.unavailable;
      return messages[String(error.message)] ?? C.errors.generic;
    }
    return C.errors.generic;
  }

  switch (error.code) {
    case "invalid_credentials":
      return C.errors.credentials;
    case "email_not_confirmed":
      return C.errors.emailNotConfirmed;
    case "email_provider_disabled":
      return C.errors.emailDisabled;
    case "signup_disabled":
      return C.errors.signupDisabled;
    case "email_exists":
    case "user_already_exists":
      return C.errors.emailExists;
    case "weak_password":
      return C.errors.weakPassword;
    case "email_address_invalid":
      return C.errors.invalidEmail;
    case "email_address_not_authorized":
      return C.errors.emailDelivery;
    case "over_email_send_rate_limit":
      return C.errors.emailRate;
    case "over_request_rate_limit":
      return C.errors.rate;
    case "same_password":
      return C.errors.samePassword;
    case "otp_expired":
    case "session_expired":
      return C.errors.authExpired;
  }

  // Older Auth responses sometimes provide only a message, without a code.
  const message = error.message.toLowerCase();
  if (message === "invalid login credentials") return C.errors.credentials;
  if (
    message.startsWith("error sending confirmation email") ||
    message.startsWith("error sending recovery email")
  )
    return C.errors.emailDelivery;
  if (error.status === 429) return C.errors.rate;
  if (error.name === "AuthRetryableFetchError")
    return error.status && error.status >= 500
      ? C.errors.authUnavailable
      : C.errors.authConnection;
  return C.errors.auth;
}
