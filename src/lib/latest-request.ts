// A refresh replaced by a newer refresh should report the newer result,
// rather than turn a successful mutation into a false refresh warning.
export class LatestRequest<T> {
  private version = 0;
  private pending: Promise<T> | null = null;

  run(work: () => Promise<T>): Promise<T> {
    const version = ++this.version;
    const task = (async () => {
      try {
        const value = await work();
        return version === this.version ? value : await this.pending!;
      } catch (error) {
        if (version !== this.version) return await this.pending!;
        throw error;
      }
    })();
    this.pending = task;
    return task;
  }
}
