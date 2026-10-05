import "server-only";
import { service } from "@/lib/supabase/server";

export async function cleanupAvatars(
  userId?: string,
  deadline = Date.now() + 10000,
) {
  const db = service();
  let cleaned = 0;
  while (Date.now() < deadline) {
    let query = db
      .from("avatar_assets")
      .select("path,user_id")
      .lte("cleanup_after", new Date().toISOString())
      .order("created_at")
      .limit(50);
    if (userId) query = query.eq("user_id", userId);
    const assets = await query;
    if (assets.error) {
      if (assets.error.code === "PGRST205" || assets.error.code === "42P01")
        return cleaned;
      throw assets.error;
    }
    if (!assets.data?.length) break;
    const before = cleaned;
    let failed = false;
    for (const asset of assets.data ?? []) {
      if (Date.now() >= deadline) break;
      const claim = await db.rpc("claim_avatar_cleanup", {
        p_path: asset.path,
      });
      if (claim.error) throw claim.error;
      if (!claim.data) continue;
      // Claiming and activating an avatar use the same database lock. A claimed
      // pending upload cannot become current while its file is being removed.
      const removed = await db.storage.from("avatars").remove([asset.path]);
      if (removed.error) {
        failed = true;
        continue;
      }
      const ack = await db
        .from("avatar_assets")
        .delete()
        .eq("path", asset.path)
        .eq("state", "deleting");
      if (ack.error) throw ack.error;
      cleaned++;
    }
    if (failed || cleaned === before) break;
  }
  return cleaned;
}
