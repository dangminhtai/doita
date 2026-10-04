import { timingSafeEqual } from "node:crypto";
import { service } from "@/lib/supabase/server";
import { flushPush } from "@/lib/notifications/push";
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
    const push = await flushPush();
    return Response.json({ ok: true, couples: data, push });
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
