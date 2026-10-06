import "server-only";
import { defaultAvatarUrl } from "@/lib/default-avatar";
import { createHmac } from "node:crypto";
import { service } from "@/lib/supabase/server";
import { localDate } from "@/lib/date";
import { currentDailyStreak, togetherDays } from "@/lib/space-stats";

export const publicIdValid = (id: string) => /^[0-9]{9}$/.test(id);
export const publicHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
type Snapshot = {
  publicId: string;
  timezone: string;
  startDate: string | null;
  members: {
    gender: string | null;
    displayName: string;
    bio: string;
    memberRef: string;
    avatarPath: string | null;
  }[];
  streak: { current_streak: number; last_completed_date: string | null } | null;
};
export async function readPublicSnapshot(id: string): Promise<Snapshot | null> {
  if (!publicIdValid(id)) return null;
  const { data, error } = await service().rpc("public_space_snapshot", {
    p_public_id: id,
  });
  if (error) throw error;
  return data as Snapshot | null;
}
export async function allowPublicRead(
  headers: Headers,
  kind: "metadata" | "avatar",
) {
  const ip = (
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-forwarded-for") ??
    "unknown"
  )
    .split(",")[0]
    .trim();
  const key = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`${kind}:${ip}`)
    .digest("hex");
  const { data, error } = await service().rpc("consume_public_read", {
    p_key: key,
    p_limit: kind === "avatar" ? 180 : 60,
  });
  if (error) throw error;
  return data === true;
}
export function publicProjection(snapshot: Snapshot) {
  const today = localDate(new Date(), snapshot.timezone);
  return {
    publicId: snapshot.publicId,
    memberCount: snapshot.members.length,
    members: snapshot.members.map((member, index) => ({
      displayName: member.displayName,
      bio: member.bio,
      fallbackAvatarUrl: defaultAvatarUrl(
        member.gender,
        index,
        snapshot.members.find((person) => person.memberRef !== member.memberRef)
          ?.gender,
      ),
      avatarUrl: !member.avatarPath
        ? defaultAvatarUrl(
            member.gender,
            index,
            snapshot.members.find(
              (person) => person.memberRef !== member.memberRef,
            )?.gender,
          )
        : `/api/spaces/${snapshot.publicId}/avatars/${member.memberRef}?v=${createHmac(
            "sha256",
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          )
            .update(member.avatarPath ?? "default")
            .digest("hex")
            .slice(0, 12)}`,
    })),
    coupleStats:
      snapshot.members.length === 2
        ? {
            streakDays: snapshot.streak
              ? currentDailyStreak(snapshot.streak, today)
              : null,
            togetherDays: togetherDays(snapshot.startDate, today),
            asOfDate: today,
          }
        : null,
  };
}
