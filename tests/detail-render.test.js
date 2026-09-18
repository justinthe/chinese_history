import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, EVENTS, IMAGES } from '../src/data.js';
import { imageFor, neighbors } from '../src/views/detail.js';

const CONTENT_DIR = fileURLToPath(new URL('../content/', import.meta.url));
const fsRead = (file) => JSON.parse(readFileSync(`${CONTENT_DIR}${file}`, 'utf8'));

beforeAll(async () => {
  await load(fsRead);
});

describe('detail.js: imageFor', () => {
  it('resolves a manifest entry to {src, alt, credit, license, licenseUrl}', () => {
    // 'qin' was the phase-06 hand-placed SVG placeholder; phase 10's content
    // fill replaced it with a real fetched Commons photo (img/qin-detail.webp).
    const img = imageFor('qin', IMAGES);
    expect(img).not.toBeNull();
    expect(img.src).toContain('img/qin-detail.webp');
    expect(img.alt).toBeTruthy();
    expect(img.credit).toBeTruthy();
    expect(img.license).toBeTruthy();
  });

  it('returns null when the event has no manifest entry (icon-fallback case)', () => {
    // 'gunpowder' has no Commons/Met source with an allowlisted license
    // (phase-10 content fill searched it repeatedly and found none) — a
    // stable imageless fixture, unlike 'wall', which phase 10 gave a real
    // image to (it previously seeded a deliberately-rejected NC license).
    expect(imageFor('gunpowder', IMAGES)).toBeNull();
    expect(imageFor('nonexistent-id', IMAGES)).toBeNull();
  });
});

describe('detail.js: neighbors', () => {
  it('is chronological within category, not content/events.json file order', () => {
    // Derives the expected order from EVENTS itself (phase-10 content fill added
    // many more 'people' events, so a hardcoded pair would break on every new one).
    const confucius = EVENTS.find((e) => e.id === 'confucius'); // people, -551
    const peopleByYear = EVENTS.filter((e) => e.category === 'people').sort((a, b) => a.year - b.year);
    const i = peopleByYear.findIndex((e) => e.id === 'confucius');
    expect(neighbors(confucius).prev?.id ?? null).toBe(peopleByYear[i - 1]?.id ?? null);
    expect(neighbors(confucius).next?.id ?? null).toBe(peopleByYear[i + 1]?.id ?? null);

    const last = peopleByYear[peopleByYear.length - 1];
    expect(neighbors(last).next).toBeNull();
    expect(neighbors(peopleByYear[0]).prev).toBeNull();
  });

  it('is null at both ends of a category', () => {
    const only = { id: 'solo', category: 'zzz-unused', year: 0 };
    const { prev, next } = neighbors(only, [only]);
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});

describe('detail.js / icons.js: no innerHTML (architecture.md §7 content-injection rule)', () => {
  const src = readFileSync(new URL('../src/views/detail.js', import.meta.url), 'utf8');
  const icons = readFileSync(new URL('../src/icons.js', import.meta.url), 'utf8');

  it('detail.js never assigns innerHTML', () => {
    expect(src).not.toMatch(/\.innerHTML\s*=/);
  });

  it('icons.js never assigns innerHTML', () => {
    expect(icons).not.toMatch(/\.innerHTML\s*=/);
  });
});
