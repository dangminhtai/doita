export function localDate(now: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function dayGap(a: string, b: string) {
  return Math.round(
    (Date.parse(a + "T00:00:00Z") - Date.parse(b + "T00:00:00Z")) / 86400000,
  );
}
export function nextStreak(
  current: number,
  last: string | null,
  today: string,
) {
  if (last === today) return current;
  return last && dayGap(today, last) === 1 ? current + 1 : 1;
}
export function canRepair(last: string | null, today: string, tokens: number) {
  return !!last && dayGap(today, last) === 2 && tokens > 0;
}
