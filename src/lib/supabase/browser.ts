import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
  ));
}
export async function rpc(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await db().rpc(name, args);
  if (error) throw error;
  return data;
}
export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const { data } = await db().auth.getSession();
  const response = await fetch(path, {
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
