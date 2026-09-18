import { describe, it, expect, vi } from 'vitest';
import { easeOutCubic, lerpPoints, tween } from '../src/lib/tween.js';

describe('easeOutCubic', () => {
  it('is 0 at k=0 and 1 at k=1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('is monotonically non-decreasing across [0,1]', () => {
    let prev = -Infinity;
    for (let k = 0; k <= 1; k += 0.05) {
      const v = easeOutCubic(k);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('lerpPoints', () => {
  const from = [0, 0, 10, 10];
  const to = [100, 200, 20, 30];

  it('equals from at k=0', () => {
    expect(lerpPoints(from, to, 0)).toEqual(from);
  });

  it('equals to at k=1', () => {
    expect(lerpPoints(from, to, 1)).toEqual(to);
  });

  it('is elementwise midpoint at k=0.5', () => {
    expect(lerpPoints(from, to, 0.5)).toEqual([50, 100, 15, 20]);
  });

  it('clamps k outside [0,1]', () => {
    expect(lerpPoints(from, to, -1)).toEqual(from);
    expect(lerpPoints(from, to, 2)).toEqual(to);
  });
});

describe('tween()', () => {
  it('reduced motion: emits exactly one frame equal to `to`, never calls raf', () => {
    const frames = [];
    const raf = vi.fn();
    const cancel = vi.fn();
    tween([0, 0], [10, 10], { reduced: true, onFrame: (p) => frames.push(p), raf, cancel });
    expect(frames).toEqual([[10, 10]]);
    expect(raf).not.toHaveBeenCalled();
  });

  it('animates from → to across a fake clock, final frame exactly equals `to`', () => {
    const frames = [];
    let t = 0;
    const queued = [];
    const raf = (cb) => queued.push(cb);
    const cancel = () => {};
    const now = () => t;

    tween([0, 0], [100, 200], { duration: 600, reduced: false, onFrame: (p) => frames.push(p), now, raf, cancel });

    // Drain queued frames, advancing the fake clock each time, until the tween stops queuing.
    while (queued.length) {
      const cb = queued.shift();
      t += 100;
      cb(t);
    }

    expect(frames.length).toBeGreaterThan(1);
    expect(frames.at(-1)).toEqual([100, 200]);
  });

  it('stop() cancels the in-flight frame', () => {
    const cancel = vi.fn();
    const raf = () => 42;
    const stop = tween([0], [1], { reduced: false, onFrame: () => {}, raf, cancel, now: () => 0 });
    stop();
    expect(cancel).toHaveBeenCalledWith(42);
  });
});
