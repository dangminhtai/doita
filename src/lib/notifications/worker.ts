export async function processWithinBudget<T>(
  items: T[],
  process: (item: T) => Promise<void>,
  deadline: number,
  concurrency = 5,
  now = Date.now,
) {
  let index = 0;
  let failed = false;
  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, async () => {
      while (!failed && index < items.length && now() < deadline) {
        const item = items[index++];
        try {
          await process(item);
        } catch (e) {
          failed = true;
          throw e;
        }
      }
    }),
  );
  const rejected = results.find((r) => r.status === "rejected");
  if (rejected?.status === "rejected") throw rejected.reason;
  return index;
}
