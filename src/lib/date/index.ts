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
export function nextOccurrence(
  date: string,
  kind: string,
  today: string,
  repeatRule?: string | null,
): string | null {
  if (
    !(repeatRule
      ? repeatRule === "yearly"
      : ["birthday", "anniversary"].includes(kind))
  )
    return date >= today ? date : null;
  // Feb 29 recurs only in leap years, matching the cron's MM-DD comparison.
  for (
    let year = Number(today.slice(0, 4));
    year <= Number(today.slice(0, 4)) + 8;
    year++
  ) {
    const candidate = `${year}${date.slice(4)}`;
    if (
      new Date(candidate + "T12:00:00Z").toISOString().slice(0, 10) ===
        candidate &&
      candidate >= today
    )
      return candidate;
  }
  return null;
}

// Resolve calendar midnight in the couple timezone, including DST offsets.
export function dayBoundary(date: string, timezone: string) {
  const target = Date.parse(date + "T00:00:00Z");
  let candidate = target;
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      format.formatToParts(candidate).map((p) => [p.type, Number(p.value)]),
    );
    const observed = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const shift = target - observed;
    if (!shift) break;
    candidate += shift;
  }
  return new Date(candidate).toISOString();
}
