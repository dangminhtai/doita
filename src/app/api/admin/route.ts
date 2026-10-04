import { userClient, service } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const ctx = await userClient(request);
  if (!ctx) return Response.json({ ok: false }, { status: 401 });
  if (
    !(process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((x) => x.trim())
      .includes(ctx.user.id)
  )
    return Response.json({ ok: false }, { status: 403 });
  const db = service();
  const tables = [
    "profiles",
    "couples",
    "daily_prompts",
    "activities",
    "prayers",
    "memories",
    "push_subscriptions",
  ];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { count, error } = await db
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) return Response.json({ ok: false }, { status: 500 });
    counts[table] = count ?? 0;
  }
  const { data: jobs, error } = await db.from("system_jobs").select("*");
  return Response.json(
    { counts, jobs: jobs ?? [], ok: !error },
    { headers: { "Cache-Control": "no-store" } },
  );
}
