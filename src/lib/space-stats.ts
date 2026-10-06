import { dayGap } from "@/lib/date";

export function currentDailyStreak(
  streak:
    | { current_streak?: number; last_completed_date?: string | null }
    | null
    | undefined,
  today: string,
) {
  return streak?.last_completed_date &&
    dayGap(today, streak.last_completed_date) <= 2
    ? (streak.current_streak ?? 0)
    : 0;
}
export function togetherDays(start: string | null, today: string) {
  return start && start <= today ? dayGap(today, start) + 1 : null;
}
