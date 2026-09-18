import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load, search } from '../src/data.js';
import { fold, parseYear } from '../src/lib/normalize.js';

const CONTENT_DIR = fileURLToPath(new URL('../content/', import.meta.url));
const fsRead = (file) => JSON.parse(readFileSync(`${CONTENT_DIR}${file}`, 'utf8'));

beforeAll(async () => {
  await load(fsRead);
});

describe('normalize.js: fold', () => {
  it('strips diacritics and lowercases', () => {
    expect(fold('Qín Shǐhuáng')).toBe('qin shihuang');
    expect(fold('JIǍGǓWÉN')).toBe('jiaguwen');
  });
});

describe('normalize.js: parseYear', () => {
  it('parses plain, negative, and BCE/CE-suffixed years', () => {
    expect(parseYear('1368')).toBe(1368);
    expect(parseYear('-221')).toBe(-221);
    expect(parseYear('221 BCE')).toBe(-221);
    expect(parseYear('221bce')).toBe(-221);
    expect(parseYear('105 CE')).toBe(105);
    expect(parseYear('221 BC')).toBe(-221);
    expect(parseYear('105 AD')).toBe(105);
  });

  it('returns null for non-year text', () => {
    expect(parseYear('zzz')).toBeNull();
    expect(parseYear('qin shihuang')).toBeNull();
  });
});

describe('data.js: search', () => {
  it('matches "paper" to Cai Lun', () => {
    const hits = search('paper');
    expect(hits.some((h) => h.id === 'paper')).toBe(true);
  });

  it('matches "Qin Shihuang" (no tone marks) via diacritic-insensitive pinyin', () => {
    const hits = search('Qin Shihuang');
    expect(hits.some((h) => h.id === 'qin')).toBe(true);
  });

  it('matches "221 BCE" to a jump-to-year hit in Qin', () => {
    const hits = search('221 BCE');
    const jump = hits.find((h) => h.id === null);
    expect(jump).toBeTruthy();
    expect(jump.year).toBe(-221);
    expect(jump.label).toContain('221 BCE');
    expect(jump.label).toContain('Qin');
  });

  it('matches "-221" the same as "221 BCE"', () => {
    const hits = search('-221');
    const jump = hits.find((h) => h.id === null);
    expect(jump.year).toBe(-221);
  });

  it('matches "1368" to a jump-to-year hit in Ming', () => {
    const hits = search('1368');
    const jump = hits.find((h) => h.id === null);
    expect(jump.label).toBe('Jump to 1368 CE (Ming)');
  });

  it('returns no hits for "zzz"', () => {
    expect(search('zzz')).toEqual([]);
  });

  it('caps results at 6', () => {
    expect(search('a').length).toBeLessThanOrEqual(6);
  });
});
