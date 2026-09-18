import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { spreadPins, viewBoxFor } from '../src/views/map.js';
import { load, eventsIn } from '../src/data.js';

const CONTENT_DIR = new URL('../content/', import.meta.url);
const fsRead = (file) => JSON.parse(readFileSync(new URL(file, CONTENT_DIR), 'utf8'));

beforeAll(async () => {
  await load(fsRead);
});

describe('spreadPins', () => {
  it('nudges every pair at least minDist apart', () => {
    const events = Array.from({ length: 10 }, (_, i) => ({ id: i, xy: [300, 250] })); // all identical
    const placed = spreadPins(events, 24);
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const dist = Math.hypot(placed[i].px - placed[j].px, placed[i].py - placed[j].py);
        expect(dist).toBeGreaterThanOrEqual(24 - 0.01);
      }
    }
  });

  it('leaves already-separated pins at their original coordinates', () => {
    const events = [{ id: 'a', xy: [50, 50] }, { id: 'b', xy: [550, 450] }];
    const placed = spreadPins(events, 24);
    expect(placed[0].px).toBe(50);
    expect(placed[0].py).toBe(50);
    expect(placed[1].px).toBe(550);
    expect(placed[1].py).toBe(450);
  });

  it('preserves ids and order', () => {
    const events = [{ id: 'x', xy: [10, 10] }, { id: 'y', xy: [20, 20] }, { id: 'z', xy: [30, 30] }];
    const placed = spreadPins(events);
    expect(placed.map((p) => p.id)).toEqual(['x', 'y', 'z']);
  });

  it('keeps results inside the 600x500 viewBox', () => {
    const events = Array.from({ length: 12 }, (_, i) => ({ id: i, xy: [300, 250] }));
    const placed = spreadPins(events, 24);
    placed.forEach((p) => {
      expect(p.px).toBeGreaterThanOrEqual(0);
      expect(p.px).toBeLessThanOrEqual(600);
      expect(p.py).toBeGreaterThanOrEqual(0);
      expect(p.py).toBeLessThanOrEqual(500);
    });
  });
});

describe('eventsIn (pin filtering contract map.js relies on)', () => {
  it('returns only events for the given era and active categories', () => {
    const allCats = new Set(['dynasty', 'war', 'tech', 'nature', 'people', 'other']);
    const events = eventsIn('qin', allCats);
    expect(events.length).toBeGreaterThan(0);
    events.forEach((e) => expect(e.era).toBe('qin'));
  });

  it('returns empty when the active category set excludes every event in the era', () => {
    const events = eventsIn('qin', new Set(['nature']));
    expect(events).toEqual([]);
  });
});

describe('viewBoxFor', () => {
  const square = [200, 200, 400, 200, 400, 300, 200, 300]; // centroid (300, 250)

  it('at 1x zoom returns the full map frame', () => {
    expect(viewBoxFor(square, 1)).toBe('0 0 600 500');
  });

  it('at 2x zoom returns a half-size box centred on the centroid', () => {
    expect(viewBoxFor(square, 2)).toBe('150 125 300 250');
  });

  it('clamps the box within the map frame when the centroid is near an edge', () => {
    const edgeShape = [0, 0, 20, 0, 20, 20, 0, 20]; // centroid (10, 10)
    const vb = viewBoxFor(edgeShape, 2);
    const [minX, minY] = vb.split(' ').map(Number);
    expect(minX).toBeGreaterThanOrEqual(0);
    expect(minY).toBeGreaterThanOrEqual(0);
  });

  it('clamps zoom outside [1,2]', () => {
    expect(viewBoxFor(square, 5)).toBe(viewBoxFor(square, 2));
    expect(viewBoxFor(square, 0)).toBe(viewBoxFor(square, 1));
  });
});
