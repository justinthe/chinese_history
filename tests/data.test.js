import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, eraAt, search, EVENTS, ERAS } from '../src/data.js';

const CONTENT_DIR = fileURLToPath(new URL('../content/', import.meta.url));
const fsRead = (file) => JSON.parse(readFileSync(`${CONTENT_DIR}${file}`, 'utf8'));

beforeAll(async () => {
  await load(fsRead);
});

describe('data.js: load()', () => {
  it('indexes eras, events and tour from content/*.json', () => {
    expect(ERAS.length).toBeGreaterThan(0);
    expect(EVENTS.length).toBeGreaterThan(0);
  });

  it('normalises the last era\'s end: null to the current year (PRD A7)', () => {
    const last = ERAS[ERAS.length - 1];
    expect(last.end).toBe(new Date().getFullYear());
  });
});

describe('data.js: eraAt', () => {
  it('resolves a BCE year to the right era', () => {
    expect(eraAt(-221).id).toBe('qin');
  });

  it('is inclusive of era.start', () => {
    const qin = ERAS.find((e) => e.id === 'qin');
    expect(eraAt(qin.start).id).toBe('qin');
  });

  it('is exclusive of era.end (that year belongs to the next era)', () => {
    const qin = ERAS.find((e) => e.id === 'qin');
    expect(eraAt(qin.end).id).not.toBe('qin');
  });

  it('clamps a year before the first era to the first era', () => {
    expect(eraAt(-999999).id).toBe(ERAS[0].id);
  });

  it('clamps a year after the last era to the last era', () => {
    expect(eraAt(ERAS[ERAS.length - 1].end + 500).id).toBe(ERAS[ERAS.length - 1].id);
  });

  it('has gapless era coverage — every year in range resolves to an era that actually contains it', () => {
    // Phase 10: eras.json must tile with no holes (a gap silently falls through
    // to the last era, see src/data.js's eraAt implementation).
    for (let y = ERAS[0].start; y < ERAS[ERAS.length - 1].start; y += 1) {
      const era = eraAt(y);
      expect(y >= era.start && y < era.end).toBe(true);
    }
  });
});

describe('data.js: search', () => {
  it('matches by year and offers a jump-to-era hit', () => {
    const hits = search('690');
    expect(hits.some((h) => h.year === 690)).toBe(true);
  });

  it('matches by title', () => {
    const hits = search('Great Wall');
    expect(hits.some((h) => h.id === 'wall')).toBe(true);
  });

  it('matches by hanzi', () => {
    const yu = EVENTS.find((e) => e.id === 'yu');
    const hits = search(yu.hanzi);
    expect(hits.some((h) => h.id === 'yu')).toBe(true);
  });

  it('matches by pinyin', () => {
    const oracle = EVENTS.find((e) => e.id === 'oracle');
    const hits = search(oracle.pinyin.slice(0, 5));
    expect(hits.some((h) => h.id === 'oracle')).toBe(true);
  });

  it('returns at most 6 hits', () => {
    // 'a' matches most titles/pinyin — exercises the slice(0, 6) cap.
    expect(search('a').length).toBeLessThanOrEqual(6);
  });

  it('returns nothing for an empty query', () => {
    expect(search('   ')).toEqual([]);
  });
});
