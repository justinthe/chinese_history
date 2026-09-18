import { describe, it, expect } from 'vitest';
import { assignLanes } from '../src/lib/lanes.js';

const WIDTH = 128;

function overlaps(a, b) {
  return Math.abs(a - b) < WIDTH;
}

/** Flattens placements back to a set of original item ids for coverage checks. */
function coveredIds(placements) {
  const ids = [];
  for (const p of placements) {
    if (p.more) p.more.forEach((m) => ids.push(m.id));
    else ids.push(p.id);
  }
  return ids;
}

describe('assignLanes', () => {
  it('places every input item exactly once (placed or inside a cluster)', () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ id: i, x: i * 15 }));
    const placements = assignLanes(items, { width: WIDTH, lanes: 4 });
    expect(coveredIds(placements).sort((a, b) => a - b)).toEqual(items.map((i) => i.id));
  });

  it('no two placed cards in the same lane overlap horizontally', () => {
    for (let trial = 0; trial < 20; trial++) {
      const items = Array.from({ length: 30 }, (_, i) => ({ id: i, x: Math.random() * 2000 }));
      const placements = assignLanes(items, { width: WIDTH, lanes: 4 });
      const byLane = {};
      placements.filter((p) => !p.more).forEach((p) => {
        (byLane[p.lane] ||= []).push(p.x);
      });
      Object.values(byLane).forEach((xs) => {
        xs.sort((a, b) => a - b);
        for (let i = 1; i < xs.length; i++) {
          expect(overlaps(xs[i - 1], xs[i])).toBe(false);
        }
      });
    }
  });

  it('never exceeds the lane cap', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i, x: i * 5 })); // deliberately crowded
    const placements = assignLanes(items, { width: WIDTH, lanes: 4 });
    placements.forEach((p) => expect(p.lane).toBeLessThan(4));
  });

  it('folds overflow into a "+N" cluster when a crowded run has no free lane', () => {
    // 20 items packed within one card-width of each other — far more than 4 lanes can hold.
    const items = Array.from({ length: 20 }, (_, i) => ({ id: i, x: i * 4 }));
    const placements = assignLanes(items, { width: WIDTH, lanes: 4 });
    const clusters = placements.filter((p) => p.more);
    expect(clusters.length).toBeGreaterThan(0);
    expect(clusters.reduce((n, c) => n + c.more.length, 0)).toBeGreaterThan(0);
  });

  it('sparse items each get their own lane, no clustering', () => {
    const items = [{ id: 'a', x: 0 }, { id: 'b', x: 1000 }, { id: 'c', x: 2000 }];
    const placements = assignLanes(items, { width: WIDTH, lanes: 4 });
    expect(placements.every((p) => !p.more)).toBe(true);
  });
});
