export function notificationSound() {
  let context: AudioContext | null = null;
  let closed = false;
  const unlock = async () => {
    if (closed) return;
    const Constructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Constructor) return;
    context ??= new Constructor();
    if (context.state === "suspended") await context.resume();
  };
  return {
    unlock,
    async play() {
      // Do not try to bypass autoplay rules or play an in-page sound in a hidden tab.
      if (closed || !context || document.visibilityState !== "visible") return;
      try {
        await unlock();
        if (context.state !== "running") return;
        for (const [offset, frequency] of [
          [0, 659],
          [0.14, 880],
        ]) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const start = context.currentTime + offset;
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.065, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.24);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        }
      } catch {
        // Audio permission/support must never interrupt delivery of the visual inbox.
      }
    },
    dispose() {
      closed = true;
      void context?.close().catch(() => {});
      context = null;
    },
  };
}
