import "server-only";
import webpush from "web-push";
import { service } from "@/lib/supabase/server";
import { CONTENT as C } from "@/config/content.vi";
export function allowedEndpoint(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return (
      u.protocol === "https:" &&
      u.port === "" &&
      !u.username &&
      !u.password &&
      [
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].some((host) => u.hostname === host || u.hostname.endsWith("." + host))
    );
  } catch {
    return false;
  }
}
export async function flushPush(actor?: string) {
  if (
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_SUBJECT
  )
    return { sent: 0, configured: false };
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  const db = service();
  const { data: jobs, error } = await db.rpc("claim_notifications", {
    p_actor: actor ?? null,
  });
  if (error) throw error;
  let sent = 0;
  for (const job of jobs ?? []) {
    const { data: subs, error: queryError } = await db
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", job.user_id);
    if (queryError) throw queryError;
    // Membership is rechecked at delivery time, including queued partner notifications.
    const { data: member } = await db
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", job.user_id)
      .maybeSingle();
    let permitted = !!member;
    if (job.actor_id) {
      const { data: actorMember } = await db
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", job.actor_id)
        .maybeSingle();
      permitted = permitted && member?.couple_id === actorMember?.couple_id;
    }
    if (!permitted) {
      await db
        .from("notification_outbox")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", job.id);
      continue;
    }
    const kind = job.kind as keyof typeof C.notifications;
    const body = C.notifications[kind] ?? C.notifications.reminder;
    let failed = false;
    for (const sub of subs ?? []) {
      if (!allowedEndpoint(sub.endpoint)) {
        await db.from("push_subscriptions").delete().eq("id", sub.id);
        continue;
      }
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({
            title: C.notifications.title,
            body,
            url: job.url,
            tag: job.kind,
          }),
          { TTL: 3600, timeout: 5000 },
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410)
          await db.from("push_subscriptions").delete().eq("id", sub.id);
        else failed = true;
      }
    }
    if (!failed)
      await db
        .from("notification_outbox")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", job.id);
  }
  return { sent, configured: true };
}
