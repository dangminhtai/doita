import { timingSafeEqual } from "node:crypto";
import { service } from "@/lib/supabase/server";
import { flushPush } from "@/lib/notifications/push";
import { cleanupAssets } from "@/lib/assets/cleanup";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const got = request.headers.get("authorization") ?? "";
  if (
    !process.env.CRON_SECRET ||
    Buffer.byteLength(got) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(got), Buffer.from(expected))
  )
    return Response.json({ ok: false }, { status: 401 });
  const db = service();
  try {
    const { data, error } = await db.rpc("daily_maintenance");
    if (error) throw error;
    const deadline = Date.now() + 45000;
    const [push, assets] = await Promise.all([
      flushPush(undefined, deadline),
      cleanupAssets(undefined, deadline),
    ]);
    return Response.json({ ok: true, couples: data, push, assets });
  } catch (e) {
    console.error("Daily maintenance", e);
    await db.from("system_jobs").upsert({
      name: "daily_maintenance",
      status: "error",
      error: "Maintenance failed; inspect server logs.",
    });
    return Response.json({ ok: false }, { status: 500 });
  }
}
