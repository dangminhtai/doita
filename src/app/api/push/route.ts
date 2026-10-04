import { userClient } from "@/lib/supabase/server";
import { pushSchema } from "@/features/schemas";
import { allowedEndpoint, flushPush } from "@/lib/notifications/push";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const ctx = await userClient(request);
  if (!ctx) return Response.json({ ok: false }, { status: 401 });
  try {
    const raw = await request.json();
    if (raw.action === "flush") {
      await flushPush(ctx.user.id);
      return Response.json({ ok: true });
    }
    const sub = pushSchema.parse(raw);
    if (!allowedEndpoint(sub.endpoint))
      return Response.json({ ok: false }, { status: 400 });
    const { error } = await ctx.client.rpc("save_push", {
      p_endpoint: sub.endpoint,
      p_keys: sub.keys,
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Push", e);
    return Response.json({ ok: false }, { status: 400 });
  }
}
export async function DELETE(request: Request) {
  const ctx = await userClient(request);
  if (!ctx) return Response.json({ ok: false }, { status: 401 });
  try {
    const { endpoint } = await request.json();
    if (typeof endpoint !== "string")
      return Response.json({ ok: false }, { status: 400 });
    const { error } = await ctx.client.rpc("delete_push", {
      p_endpoint: endpoint,
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
