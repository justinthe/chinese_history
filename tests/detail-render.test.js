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
    const img = imageFor('qin', IMAGES);
    expect(img).not.toBeNull();
    expect(img.src).toContain('img/qin-detail.svg');
    expect(img.alt).toBeTruthy();
    expect(img.credit).toBeTruthy();
    expect(img.license).toBeTruthy();
  });

  it('returns null when the event has no manifest entry (icon-fallback case)', () => {
    expect(imageFor('wall', IMAGES)).toBeNull();
    expect(imageFor('nonexistent-id', IMAGES)).toBeNull();
  });
});

describe('detail.js: neighbors', () => {
  it('is chronological within category, not content/events.json file order', () => {
    const confucius = EVENTS.find((e) => e.id === 'confucius'); // people, -551
    const wuzetian = EVENTS.find((e) => e.id === 'wuzetian'); // people, 690, only 2 in 'people'
    expect(neighbors(confucius).prev).toBeNull();
    expect(neighbors(confucius).next.id).toBe('wuzetian');
    expect(neighbors(wuzetian).prev.id).toBe('confucius');
    expect(neighbors(wuzetian).next).toBeNull();
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
