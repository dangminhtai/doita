import "server-only";
import webpush from "web-push";
import { processWithinBudget } from "./worker";
import { notificationTarget } from "./target";
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
export async function flushPush(actor?: string, deadline = Date.now() + 40000) {
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
  let sent = 0;
  const ack = async (job: string, values: Record<string, unknown>) => {
    const result = await db
      .from("notification_outbox")
      .update(values)
      .eq("id", job);
    if (result.error) throw result.error;
  };
  const deliver = async (job: any) => {
    const { data: member, error: memberError } = await db
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", job.user_id)
      .maybeSingle();
    if (memberError) throw memberError;
    let permitted = !!member;
    if (job.actor_id) {
      const { data: actorMember, error } = await db
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", job.actor_id)
        .maybeSingle();
      if (error) throw error;
      permitted = permitted && member?.couple_id === actorMember?.couple_id;
    }
    if (!permitted) {
      await ack(job.id, { sent_at: new Date().toISOString() });
      return;
    }
    const { data: subs, error } = await db
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", job.user_id);
    if (error) throw error;
    let failed = false;
    for (const sub of subs ?? []) {
      if (Date.now() >= deadline) {
        failed = true;
        break;
      }
      if (!allowedEndpoint(sub.endpoint)) {
        const removed = await db
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
        if (removed.error) throw removed.error;
        continue;
      }
      const receipt = await db
        .from("notification_deliveries")
        .select("*")
        .eq("job_id", job.id)
        .eq("subscription_id", sub.id)
        .maybeSingle();
      if (receipt.error) throw receipt.error;
      if (receipt.data?.delivered_at) continue;
      if (
        receipt.data?.next_attempt_at &&
        Date.parse(receipt.data.next_attempt_at) > Date.now()
      ) {
        failed = true;
        continue;
      }
      let delivered = false,
        status: number | undefined;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({
            title: C.notifications.title,
            body:
              C.notifications[job.kind as keyof typeof C.notifications] ??
              C.notifications.reminder,
            url: notificationTarget(job.url),
            tag: job.id,
          }),
          {
            TTL: 3600,
            timeout: Math.min(5000, Math.max(1, deadline - Date.now())),
          },
        );
        sent++;
        delivered = true;
      } catch (e) {
        status = (e as { statusCode?: number }).statusCode;
      }
      if (status === 404 || status === 410) {
        const removed = await db
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
        if (removed.error) throw removed.error;
        continue;
      }
      const attempts = (receipt.data?.attempts ?? 0) + 1;
      const saved = await db.from("notification_deliveries").upsert({
        job_id: job.id,
        subscription_id: sub.id,
        delivered_at: delivered ? new Date().toISOString() : null,
        attempts,
        next_attempt_at: delivered
          ? null
          : new Date(
              Date.now() + Math.min(3600000, 60000 * 2 ** attempts),
            ).toISOString(),
        last_status: status ?? null,
      });
      if (saved.error) throw saved.error;
      if (!delivered) failed = true;
    }
    if (failed)
      await ack(job.id, {
        lease_until: new Date(Date.now() + 120000).toISOString(),
      });
    else await ack(job.id, { sent_at: new Date().toISOString() });
  };
  while (Date.now() < deadline) {
    const { data: jobs, error } = await db.rpc("claim_notifications", {
      p_actor: actor ?? null,
    });
    if (error) throw error;
    if (!jobs?.length) break;
    const processed = await processWithinBudget(jobs, deliver, deadline);
    if (processed < jobs.length || jobs.length < 50) break;
  }
  const counts = await Promise.all([
    db
      .from("notification_outbox")
      .select("id", { head: true, count: "exact" })
      .is("sent_at", null)
      .lt("attempts", 5),
    db
      .from("notification_outbox")
      .select("id", { head: true, count: "exact" })
      .is("sent_at", null)
      .gte("attempts", 5),
  ]);
  for (const result of counts) if (result.error) throw result.error;
  return {
    sent,
    configured: true,
    pending: counts[0].count ?? 0,
    failed: counts[1].count ?? 0,
  };
}
