import "server-only";
import { service } from "@/lib/supabase/server";

export async function cleanupAssets(
  userId?: string,
  deadline = Date.now() + 20000,
) {
  const db = service();
  if (!userId) {
    const queued = await db.rpc("queue_abandoned_assets");
    if (queued.error) throw queued.error;
  }
  let cleaned = 0;
  while (Date.now() < deadline) {
    let q = db
      .from("memory_assets")
      .select("path,user_id,attempts")
      .eq("cleanup", true)
      .lt("attempts", 10)
      .order("created_at")
      .limit(20);
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    let failed = false;
    for (const asset of data) {
      if (Date.now() >= deadline) break;
      const result = await db.storage.from("memories").remove([asset.path]);
      if (result.error) {
        const ack = await db
          .from("memory_assets")
          .update({ attempts: asset.attempts + 1 })
          .eq("path", asset.path);
        if (ack.error) throw ack.error;
        failed = true;
      } else {
        const ack = await db
          .from("memory_assets")
          .delete()
          .eq("path", asset.path);
        if (ack.error) throw ack.error;
        cleaned++;
      }
    }
    if (failed) break;
  }
  let remaining = db
    .from("memory_assets")
    .select("path", { head: true, count: "exact" })
    .eq("cleanup", true);
  if (userId) remaining = remaining.eq("user_id", userId);
  const { count, error } = await remaining;
  if (error) throw error;
  return { cleaned, pending: count ?? 0 };
}
