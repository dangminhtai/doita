export type Activity = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  energy: string;
  enabled: boolean;
  long_distance: boolean;
  tags: string[];
};
export function recommend(
  items: Activity[],
  time: number,
  energy: string,
  preference: string,
  recent: string[] = [],
) {
  const pool = items.filter(
    (x) =>
      x.enabled &&
      x.long_distance &&
      x.duration <= time &&
      (energy === "high" || x.energy === energy || x.energy === "low") &&
      (preference === "random" || x.category === preference),
  );
  const fresh = pool.filter((x) => !recent.includes(x.id));
  return fresh.length ? fresh : pool;
}
