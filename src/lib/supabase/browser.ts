import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { boundedFetch, retryableActions } from "@/lib/request";
let client: SupabaseClient | undefined;
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
export function db() {
  if (!configured()) throw new Error("Missing environment");
  return (client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: boundedFetch } },
  ));
}
export async function rpc(name: string, args: Record<string, unknown> = {}) {
  const client = db();
  let key: string | null = null;
  let requestId: string | null = null;
  if (retryableActions.has(name)) {
    const { data: session } = await client.auth.getSession();
    if (!session.session) throw new Error("session_expired");
    const membership = await client
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", session.session.user.id)
      .maybeSingle();
    if (membership.error) throw membership.error;
    const scope =
      name === "pair_couple"
        ? "pair"
        : (membership.data?.couple_id ?? "unpaired");
    const signature = JSON.stringify(
      Object.fromEntries(
        Object.entries(args).sort(([a], [b]) => a.localeCompare(b)),
      ),
    );
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(signature),
    );
    key = `couple-request:${session.session.user.id}:${scope}:${name}:${Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, "0")).join("")}`;
    try {
      requestId = localStorage.getItem(key);
    } catch {}
    requestId ??= pendingRequests.get(key) ?? crypto.randomUUID();
    pendingRequests.set(key, requestId);
    try {
      localStorage.setItem(key, requestId);
    } catch {}
  }
  const { data, error } = await client.rpc(
    requestId ? "perform_authorized_action" : name,
    requestId
      ? {
          p_action: name,
          p_args: args,
          p_request_id: requestId,
        }
      : args,
  );
  if (error) throw error;
  if (key) {
    pendingRequests.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {}
  }
  return data;
}
const pendingRequests = new Map<string, string>();
export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const { data } = await db().auth.getSession();
  const response = await boundedFetch(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}
