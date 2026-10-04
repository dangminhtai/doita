import { userClient, service } from "@/lib/supabase/server";
export async function DELETE(request: Request) {
  const ctx = await userClient(request);
  if (!ctx) return Response.json({ ok: false }, { status: 401 });
  try {
    const db = service();
    // Registry survives leaving old couples and deleting the original memory.
    for (;;) {
      const assets = await db
        .from("memory_assets")
        .select("path")
        .eq("user_id", ctx.user.id)
        .limit(100);
      if (assets.error) throw assets.error;
      if (!assets.data?.length) break;
      const paths = assets.data.map((a) => a.path);
      const removed = await db.storage.from("memories").remove(paths);
      if (removed.error) throw removed.error;
      const ack = await db
        .from("memory_assets")
        .delete()
        .in("path", paths)
        .eq("user_id", ctx.user.id);
      if (ack.error) throw ack.error;
    }
    const { data: membership } = await ctx.client
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    const { data: owned, error: ownedError } = await db
      .from("memories")
      .select("couple_id")
      .eq("author_id", ctx.user.id);
    if (ownedError) throw ownedError;
    const coupleIds = new Set([
      ...(owned ?? []).map((row) => row.couple_id),
      ...(membership ? [membership.couple_id] : []),
    ]);
    for (const coupleId of coupleIds) {
      const prefix = `${coupleId}/${ctx.user.id}`;
      for (let round = 0; round < 100; round++) {
        const { data: files, error } = await db.storage
          .from("memories")
          .list(prefix, { limit: 100 });
        if (error) throw error;
        if (!files?.length) break;
        const result = await db.storage
          .from("memories")
          .remove(files.map((f) => `${prefix}/${f.name}`));
        if (result.error) throw result.error;
        if (round === 99)
          throw new Error("Asset cleanup incomplete; retry account deletion");
      }
    }
    const { error } = await db.auth.admin.deleteUser(ctx.user.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Account deletion", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
