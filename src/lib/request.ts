export async function boundedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 30000,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      ...init,
      signal: init.signal
        ? AbortSignal.any([init.signal, controller.signal])
        : controller.signal,
    });
    const body =
      init.method === "HEAD" || [204, 205, 304].includes(response.status)
        ? null
        : await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error("request_timeout");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const retryableActions = new Set([
  "save_note",
  "save_prayer",
  "save_memory",
  "save_special_date",
  "save_special_date_details",
  "log_activity",
  "daily_reply",
  "set_mood",
  "answer_daily",
  "toggle_note_item",
  "note_action",
  "prayer_action",
  "delete_memory",
  "delete_special_date",
  "pair_couple",
  "rotate_invite",
  "repair_streak",
  "leave_couple",
  "update_settings",
]);
export function uncertainWrite(error: unknown) {
  // Validation/constraint exceptions prove the transaction rolled back.
  // With any other failure, keep the uploaded asset until the result is known.
  return !(
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    /^(P0001|22|23)/.test(String(error.code))
  );
}
