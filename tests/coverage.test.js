import { describe, it, expect } from 'vitest';
import { coverage } from '../scripts/coverage.mjs';

function era(id) {
  return { id, name: id, hanzi: id, start: 0, end: 1, color: '#fff', capital: 'X', capitalXY: [0, 0], shape: id, oneLiner: 'x' };
}
function ev(id, era, category) {
  return { id, title: id, hanzi: id, pinyin: id, year: 0, era, category, icon: '?', body: ['p'], whyItMatters: 'w', xy: [0, 0], related: [] };
}

// One era, six categories (matches real CATS keys) — enough events per
// category/era/total to clear every threshold, used as the "all clear" base.
function passingDB() {
  const cats = ['dynasty', 'war', 'tech', 'nature', 'people', 'other'];
  const events = [];
  for (let i = 0; i < 150; i += 1) {
    events.push(ev(`e${i}`, 'a', cats[i % cats.length]));
  }
  const images = Object.fromEntries(events.slice(0, 135).map((e) => [e.id, {}])); // 90%
  return { eras: [era('a')], events, images };
}

describe('coverage: pure counts', () => {
  it('tallies per-era and per-category counts', () => {
    const db = { eras: [era('a'), era('b')], events: [ev('e1', 'a', 'tech'), ev('e2', 'b', 'war')], images: {} };
    const r = coverage(db);
    expect(r.total).toBe(2);
    expect(r.perEra).toEqual({ a: 1, b: 1 });
    expect(r.perCat.tech).toBe(1);
    expect(r.perCat.war).toBe(1);
    expect(r.perCat.dynasty).toBe(0);
  });

  it('computes image percentage, rounded', () => {
    const db = { eras: [era('a')], events: [ev('e1', 'a', 'tech'), ev('e2', 'a', 'tech'), ev('e3', 'a', 'tech')], images: { e1: {} } };
    expect(coverage(db).withImage).toBe(1);
    expect(coverage(db).imagePct).toBeCloseTo(33.3, 1);
  });

  it('does not divide by zero on an empty events list', () => {
    const r = coverage({ eras: [], events: [], images: {} });
    expect(r.total).toBe(0);
    expect(r.imagePct).toBe(0);
  });
});

describe('coverage: warnings fire at their boundary', () => {
  it('warns when total is below 150', () => {
    const db = { eras: [era('a')], events: Array.from({ length: 149 }, (_, i) => ev(`e${i}`, 'a', 'tech')), images: {} };
    expect(coverage(db).warnings.some((w) => w.includes('149 events'))).toBe(true);
  });

  it('does not warn on total when events === 150', () => {
    const db = passingDB();
    expect(db.events.length).toBe(150);
    expect(coverage(db).warnings.some((w) => w.includes('events ('))).toBe(false);
  });

  it('warns when an era has fewer than 5 events', () => {
    const aEvents = Array.from({ length: 5 }, (_, i) => ev(`a${i}`, 'a', 'tech'));
    const db = { eras: [era('a'), era('b')], events: [...aEvents, ev('e5', 'b', 'tech')], images: {} };
    expect(coverage(db).warnings.some((w) => w.includes("era 'b': 1 events"))).toBe(true);
    expect(coverage(db).warnings.some((w) => w.includes("era 'a'"))).toBe(false);
  });

  it('warns when a category has fewer than 15 events', () => {
    const db = passingDB();
    expect(coverage(db).warnings.some((w) => w.includes('category'))).toBe(false);
  });

  it('warns when image coverage is below 90%', () => {
    const db = { eras: [era('a')], events: Array.from({ length: 10 }, (_, i) => ev(`e${i}`, 'a', 'tech')), images: { e0: {} } };
    expect(coverage(db).warnings.some((w) => w.includes('images: 10%'))).toBe(true);
  });

  it('produces zero warnings when every threshold is cleared', () => {
    expect(coverage(passingDB()).warnings).toEqual([]);
  });
});
