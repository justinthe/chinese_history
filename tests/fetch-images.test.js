// No network: every HTTP call is injected (getJSON/downloadBuffer), same DI
// precedent as lib/tween.js (now/raf/cancel) and data.js (load(read)).
// Disk use is a scratch temp dir, same as tests/data.test.js reading real
// content/*.json — only network is mocked, per house convention.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalLicense, sourceHash, run } from '../scripts/fetch-images.mjs';
import { resolveCommons } from '../scripts/lib/sources/commons.mjs';
import { resolveMet } from '../scripts/lib/sources/met.mjs';
import { resolveUrl } from '../scripts/lib/sources/url.mjs';
import { resolveLocal } from '../scripts/lib/sources/local.mjs';

const ALLOWLIST = [
  'Public domain', 'PD-old', 'PD-US', 'CC0',
  'CC BY 2.0', 'CC BY 3.0', 'CC BY 4.0',
  'CC BY-SA 2.0', 'CC BY-SA 3.0', 'CC BY-SA 4.0',
];

describe('canonicalLicense: matcher table', () => {
  it.each([
    ['CC0', 'CC0'],
    ['cc by 4.0', 'CC BY 4.0'],
    ['CC BY-SA 3.0', 'CC BY-SA 3.0'],
    ['public domain', 'Public domain'],
  ])('%s -> %s', (input, expected) => {
    expect(canonicalLicense(input, ALLOWLIST)).toBe(expected);
  });

  it('rejects CC BY-NC (not-commercial excluded)', () => {
    expect(canonicalLicense('CC BY-NC 4.0', ALLOWLIST)).toBeNull();
  });

  it('rejects CC BY-ND (no-derivatives excluded)', () => {
    expect(canonicalLicense('CC BY-ND 4.0', ALLOWLIST)).toBeNull();
  });

  it('rejects fair use / arbitrary text', () => {
    expect(canonicalLicense('fair use', ALLOWLIST)).toBeNull();
  });

  it('rejects empty/missing license', () => {
    expect(canonicalLicense('', ALLOWLIST)).toBeNull();
    expect(canonicalLicense(undefined, ALLOWLIST)).toBeNull();
  });
});

describe('sourceHash: stable and order-independent', () => {
  it('is identical regardless of key order', () => {
    const a = sourceHash({ commons: 'File:X.jpg', alt: 'x', focus: 'top' });
    const b = sourceHash({ focus: 'top', alt: 'x', commons: 'File:X.jpg' });
    expect(a).toBe(b);
  });

  it('changes when the source changes', () => {
    const a = sourceHash({ commons: 'File:X.jpg' });
    const b = sourceHash({ commons: 'File:Y.jpg' });
    expect(a).not.toBe(b);
  });

  it('is prefixed sha256:', () => {
    expect(sourceHash({ met: 1 })).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe('sources/commons.mjs', () => {
  const fixture = {
    query: {
      pages: {
        1: {
          imageinfo: [{
            url: 'https://upload.wikimedia.org/full.jpg',
            thumburl: 'https://upload.wikimedia.org/thumb.jpg',
            extmetadata: {
              LicenseShortName: { value: 'CC BY-SA 3.0' },
              LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0/' },
              Artist: { value: 'Maros M r a z (<a href="https://x">Maros</a>)' },
              Credit: { value: '<span class="int-own-work">Own work</span>' },
            },
          }],
        },
      },
    },
  };

  it('resolves license/credit and strips HTML from Artist/Credit', async () => {
    const out = await resolveCommons('File:Test.jpg', { getJSON: async () => fixture, userAgent: 'x' });
    expect(out.license).toBe('CC BY-SA 3.0');
    expect(out.licenseUrl).toBe('https://creativecommons.org/licenses/by-sa/3.0/');
    expect(out.credit).toBe('Maros M r a z (Maros), Own work');
    expect(out.downloadUrl).toBe('https://upload.wikimedia.org/thumb.jpg');
  });

  it('throws when the page has no imageinfo (missing file)', async () => {
    const missing = { query: { pages: { '-1': { missing: '' } } } };
    await expect(resolveCommons('File:Nope.jpg', { getJSON: async () => missing, userAgent: 'x' }))
      .rejects.toThrow(/no imageinfo/);
  });
});

describe('sources/met.mjs', () => {
  it('resolves a public-domain object', async () => {
    const json = { isPublicDomain: true, primaryImage: 'https://images.metmuseum.org/x.jpg', artistDisplayName: '', creditLine: 'Gift of X' };
    const out = await resolveMet(42179, { getJSON: async () => json });
    expect(out.license).toBe('Public domain');
    expect(out.credit).toBe('Gift of X');
    expect(out.downloadUrl).toBe('https://images.metmuseum.org/x.jpg');
  });

  it('rejects a non-public-domain object', async () => {
    const json = { isPublicDomain: false, primaryImage: 'https://images.metmuseum.org/x.jpg' };
    await expect(resolveMet(1, { getJSON: async () => json })).rejects.toThrow(/not public domain/);
  });

  it('rejects an object with no primaryImage', async () => {
    const json = { isPublicDomain: true, primaryImage: '' };
    await expect(resolveMet(1, { getJSON: async () => json })).rejects.toThrow(/no primaryImage/);
  });
});

describe('sources/url.mjs', () => {
  const hostAllowlist = ['upload.wikimedia.org'];

  it('resolves an allowlisted host with supplied license/credit', () => {
    const src = { url: 'https://upload.wikimedia.org/x.jpg', license: 'CC BY 4.0', credit: 'Someone' };
    const out = resolveUrl(src, { hostAllowlist });
    expect(out.license).toBe('CC BY 4.0');
    expect(out.downloadUrl).toBe(src.url);
  });

  it('throws for a non-allowlisted host', () => {
    const src = { url: 'https://evil.example.com/x.jpg', license: 'CC0', credit: 'x' };
    expect(() => resolveUrl(src, { hostAllowlist })).toThrow(/not in fetch-images.allowlist/);
  });

  it('throws when license or credit is missing', () => {
    const src = { url: 'https://upload.wikimedia.org/x.jpg' };
    expect(() => resolveUrl(src, { hostAllowlist })).toThrow(/missing required/);
  });
});

describe('sources/local.mjs', () => {
  let dir;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'mke-local-')); });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('resolves an existing file', () => {
    writeFileSync(join(dir, 'x.png'), 'fake');
    const out = resolveLocal({ local: 'x.png', license: 'Illustration', credit: 'AI, reviewed' }, { contentDir: `${dir}/` });
    expect(out.filePath).toBe(`${dir}/x.png`);
    expect(out.exemptFromLicenseAllowlist).toBe(true);
  });

  it('throws when the file is missing', () => {
    expect(() => resolveLocal({ local: 'nope.png', license: 'Illustration', credit: 'x' }, { contentDir: `${dir}/` }))
      .toThrow(/not found/);
  });

  it('throws when license or credit is missing', () => {
    writeFileSync(join(dir, 'x.png'), 'fake');
    expect(() => resolveLocal({ local: 'x.png' }, { contentDir: `${dir}/` })).toThrow(/missing required/);
  });
});

describe('run(): full pipeline (fetch/skip/reject/manifest shape)', () => {
  let dir, contentDir, publicImgDir;

  const fakeSharp = (sizeByQuality) => () => ({
    resize: () => ({
      webp: ({ quality }) => ({
        toBuffer: async () => Buffer.alloc(sizeByQuality[quality]),
      }),
    }),
  });

  const fitsBudget = fakeSharp({ 80: 60 * 1024, 60: 45 * 1024, 45: 30 * 1024 }); // fits both card (40KB) and detail (150KB) budgets at quality 45
  const neverFits = fakeSharp({ 80: 999999, 60: 999999, 45: 999999 });

  const fakeGetJSON = async (url) => {
    if (url.includes('commons.wikimedia.org')) {
      return {
        query: {
          pages: {
            1: {
              imageinfo: [{
                url: 'https://upload.wikimedia.org/full.jpg',
                extmetadata: { LicenseShortName: { value: 'CC BY-SA 3.0' }, LicenseUrl: { value: 'https://x/sa' }, Artist: { value: 'Artist' } },
              }],
            },
          },
        },
      };
    }
    throw new Error(`unexpected getJSON url: ${url}`);
  };

  const fakeDownloadBuffer = async () => Buffer.alloc(500 * 1024); // pre-resize size, irrelevant to fake sharp

  // same baseDB()-style fixture factory as tests/validate.test.js — override per test with { ...baseDeps(), ... }
  function baseDeps(sharp = fitsBudget) {
    return {
      getJSON: fakeGetJSON, downloadBuffer: fakeDownloadBuffer, throttle: async () => {}, sharp,
      userAgent: 'test', contentDir, publicImgDir, hostAllowlist: ['upload.wikimedia.org'], licenseAllowlist: ALLOWLIST,
    };
  }

  function writeFixtures({ events, manifest = {} }) {
    writeFileSync(join(contentDir, 'events.json'), JSON.stringify(events));
    writeFileSync(join(contentDir, 'images.manifest.json'), JSON.stringify(manifest));
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'mke-run-'));
    contentDir = `${dir}/content/`;
    publicImgDir = `${dir}/public/img/`;
    mkdirSync(contentDir, { recursive: true });
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const events = [
    { id: 'a', title: 'A', image: { commons: 'File:A.jpg', alt: 'alt a' } },
    { id: 'b', title: 'B', image: { url: 'https://upload.wikimedia.org/b.jpg', license: 'CC BY-NC 4.0', credit: 'bad license' } },
  ];

  it('fetches an allowlisted source and rejects a non-allowlisted license; exit 1', async () => {
    writeFixtures({ events, manifest: { zzz: { card: 'img/zzz-card.webp', sourceHash: 'sha256:keep' } } });
    const result = await run({}, baseDeps());
    expect(result.fetched.map((r) => r.id)).toEqual(['a']);
    expect(result.rejected.map((r) => r.id)).toEqual(['b']);
    expect(result.exitCode).toBe(1);

    const manifest = JSON.parse(readFileSync(join(contentDir, 'images.manifest.json'), 'utf8'));
    expect(manifest.a).toMatchObject({
      card: 'img/a-card.webp', detail: 'img/a-detail.webp', alt: 'alt a',
      license: 'CC BY-SA 3.0', licenseUrl: 'https://x/sa',
    });
    expect(manifest.a.sourceHash).toMatch(/^sha256:/);
    // pre-existing unrelated entry survives untouched (merge, never clobber)
    expect(manifest.zzz).toEqual({ card: 'img/zzz-card.webp', sourceHash: 'sha256:keep' });

    expect(existsSync(join(publicImgDir, 'a-card.webp'))).toBe(true);
    expect(existsSync(join(publicImgDir, 'a-detail.webp'))).toBe(true);
  });

  it('--allow-missing turns a rejection into exit 0', async () => {
    writeFixtures({ events });
    const result = await run({ allowMissing: true }, baseDeps());
    expect(result.rejected.length).toBe(1);
    expect(result.exitCode).toBe(0);
  });

  it('is idempotent: unchanged source + existing files -> skipped, no re-fetch', async () => {
    writeFixtures({ events: [events[0]] });
    const deps = baseDeps();
    const first = await run({}, deps);
    expect(first.fetched.map((r) => r.id)).toEqual(['a']);

    let calls = 0;
    const countingGetJSON = async (url) => { calls += 1; return fakeGetJSON(url); };
    const second = await run({}, { ...deps, getJSON: countingGetJSON });
    expect(second.skipped.map((r) => r.id)).toEqual(['a']);
    expect(second.fetched).toEqual([]);
    expect(calls).toBe(0);
  });

  it('--force re-fetches even when the source is unchanged', async () => {
    writeFixtures({ events: [events[0]] });
    const deps = baseDeps();
    await run({}, deps);
    const forced = await run({ force: true }, deps);
    expect(forced.fetched.map((r) => r.id)).toEqual(['a']);
  });

  it('--dry-run never writes files or the manifest/report', async () => {
    writeFixtures({ events: [events[0]] });
    const result = await run({ dryRun: true }, baseDeps());
    expect(result.fetched.map((r) => r.id)).toEqual(['a']);
    expect(existsSync(join(publicImgDir, 'a-card.webp'))).toBe(false);
    const manifest = JSON.parse(readFileSync(join(contentDir, 'images.manifest.json'), 'utf8'));
    expect(manifest.a).toBeUndefined();
  });

  it('reports a failure (not a rejection) when the resize never fits budget', async () => {
    writeFixtures({ events: [events[0]] });
    const result = await run({}, baseDeps(neverFits));
    expect(result.failed.map((r) => r.id)).toEqual(['a']);
    expect(result.rejected).toEqual([]);
    expect(result.exitCode).toBe(1);
  });

  it('--only filters to a single event id', async () => {
    writeFixtures({ events });
    const result = await run({ only: 'a' }, baseDeps());
    expect(result.fetched.map((r) => r.id)).toEqual(['a']);
    expect(result.rejected).toEqual([]);
  });
});
