// architecture.md §4 / phase-05: pure point-array tween. No DOM, no window —
// clock/raf/cancel injected so this runs under vitest's node environment.
// Extracted verbatim from the old map.js:136-156 inline rAF loop.

export const easeOutCubic = (k) => 1 - (1 - k) ** 3;

/** Elementwise lerp between two equal-length point arrays. k is clamped to [0,1]. */
export function lerpPoints(from, to, k) {
  const kk = Math.max(0, Math.min(1, k));
  return from.map((v, i) => v + (to[i] - v) * kk);
}

/**
 * Animates `from` → `to` over `duration` ms via rAF, easing with
 * `easeOutCubic`, calling `onFrame(points)` each step. `reduced: true` skips
 * straight to the final frame (PRD §8 prefers-reduced-motion). Returns a
 * `stop()` function that cancels any in-flight frame.
 */
export function tween(from, to, { duration = 600, reduced = false, onFrame, now = () => performance.now(), raf = requestAnimationFrame, cancel = cancelAnimationFrame } = {}) {
  if (reduced) {
    onFrame(to.slice());
    return () => {};
  }
  let handle;
  const t0 = now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / duration);
    onFrame(lerpPoints(from, to, easeOutCubic(k)));
    if (k < 1) handle = raf(step);
  };
  handle = raf(step);
  return () => cancel(handle);
}
