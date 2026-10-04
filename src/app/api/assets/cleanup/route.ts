import { userClient } from "@/lib/supabase/server";
import { cleanupAssets } from "@/lib/assets/cleanup";
export const maxDuration = 30;
export async function POST(request: Request) {
  const ctx = await userClient(request);
  if (!ctx) return Response.json({ ok: false }, { status: 401 });
  try {
    return Response.json({ ok: true, ...(await cleanupAssets(ctx.user.id)) });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
