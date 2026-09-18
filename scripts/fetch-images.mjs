#!/usr/bin/env node
// architecture.md §4 / PRD F8: build-time image fetch pipeline. Resolves
// each event's declared `image` source (commons/met/url/local), checks its
// license, downloads (throttled, size/type checked per architecture §7),
// resizes to card/detail webp under PRD §8's KB budgets, and writes
// content/images.manifest.json + content/images.report.json.
//
// Same shape as validate.mjs: pure exports (canonicalLicense, sourceHash,
// run) + a guarded main() so tests import the exports directly, no disk, no
// network (tests/fetch-images.test.js).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { resolveCommons } from './lib/sources/commons.mjs';
import { resolveMet } from './lib/sources/met.mjs';
import { resolveUrl } from './lib/sources/url.mjs';
import { resolveLocal } from './lib/sources/local.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CONTENT_DIR = `${ROOT}content/`;
const PUBLIC_IMG_DIR = `${ROOT}public/img/`;

const CARD = { width: 400, height: 300, maxKB: 40 };
const DETAIL = { width: 1200, maxKB: 150 };
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const THROTTLE_MS = 1000;

/** Matches a license string against the allowlist, case-insensitively. Returns
 *  the canonical allowlist entry, or null if not allowed. */
export function canonicalLicense(license, allowlist) {
  if (!license) return null;
  const norm = license.trim().toLowerCase();
  return allowlist.find((a) => a.toLowerCase() === norm) || null;
}

/** Stable hash of an ImageSource object — order-independent so re-running
 *  with the same source (keys in any order) is recognised as unchanged. */
export function sourceHash(src) {
  const stable = JSON.stringify(src, Object.keys(src).sort());
  return `sha256:${createHash('sha256').update(stable).digest('hex')}`;
}

/** Picks the source module for an event's `image` field. Returns
 *  `{ kind, resolve() }` or throws for a malformed/multi-key source. */
function pickSource(image, deps) {
  if (image.commons) return { kind: 'commons', resolve: () => resolveCommons(image.commons, deps) };
  if (image.met) return { kind: 'met', resolve: () => resolveMet(image.met, deps) };
  if (image.url) return { kind: 'url', resolve: () => resolveUrl(image, deps) };
  if (image.local) return { kind: 'local', resolve: () => resolveLocal(image, deps) };
  throw new Error('image source must have exactly one of: commons, met, url, local');
}

function defaultThrottle() {
  let last = 0;
  return async () => {
    const wait = last + THROTTLE_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
  };
}

async function defaultGetJSON(url, { userAgent } = {}) {
  const res = await fetch(url, { headers: userAgent ? { 'User-Agent': userAgent } : {} });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function defaultDownloadBuffer(url, { userAgent }) {
  const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`GET ${url} -> unexpected Content-Type '${contentType}'`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_DOWNLOAD_BYTES) throw new Error(`GET ${url} -> ${buf.length} bytes exceeds ${MAX_DOWNLOAD_BYTES} limit`);
  return buf;
}

/** Resizes `buf` to fit `{width,[height],maxKB}`, stepping quality down
 *  until it's under budget. Throws if even the lowest quality doesn't fit —
 *  that's a failure to report, not a silent overage (PRD §8 budgets). */
async function resizeToBudget(sharpLib, buf, { width, height, maxKB, focus }) {
  const position = focus || 'center';
  for (const quality of [80, 60, 45]) {
    let pipeline = sharpLib(buf).resize(width, height, height ? { fit: 'cover', position } : { fit: 'inside' });
    const out = await pipeline.webp({ quality }).toBuffer();
    if (out.length <= maxKB * 1024) return out;
  }
  throw new Error(`could not fit image under ${maxKB}KB at any quality step`);
}

function readJSON(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Runs the pipeline. `opts`: { only, force, dryRun, allowMissing }.
 * `deps` (all injectable for tests, defaulted for real runs): getJSON,
 * downloadBuffer, throttle, sharp, userAgent, contentDir, publicImgDir,
 * hostAllowlist, licenseAllowlist, writeFile, mkdir.
 * Returns `{ fetched, skipped, rejected, failed, exitCode }`.
 */
export async function run(opts = {}, deps = {}) {
  const {
    getJSON = defaultGetJSON,
    downloadBuffer = defaultDownloadBuffer,
    throttle = defaultThrottle(),
    sharp: sharpLib = null,
    userAgent = process.env.FETCH_USER_AGENT || 'MiddleKingdomExplorer/0.1 (build script; no contact configured)',
    contentDir = CONTENT_DIR,
    publicImgDir = PUBLIC_IMG_DIR,
    hostAllowlist = readJSON(`${ROOT}scripts/fetch-images.allowlist.json`, []),
    licenseAllowlist = readJSON(`${ROOT}scripts/licenses.allowlist.json`, []),
    writeFile = writeFileSync,
    mkdir = mkdirSync,
  } = deps;

  const events = readJSON(`${contentDir}events.json`, []);
  const manifest = readJSON(`${contentDir}images.manifest.json`, {});
  const targets = events.filter((e) => e.image && (!opts.only || e.id === opts.only));

  const fetched = [];
  const skipped = [];
  const rejected = [];
  const failed = [];

  for (const ev of targets) {
    try {
      const src = pickSource(ev.image, { getJSON, hostAllowlist, contentDir, throttle, userAgent });
      const hash = sourceHash(ev.image);
      const cardPath = `${publicImgDir}${ev.id}-card.webp`;
      const detailPath = `${publicImgDir}${ev.id}-detail.webp`;
      const unchanged = !opts.force && manifest[ev.id]?.sourceHash === hash
        && existsSync(cardPath) && existsSync(detailPath);
      if (unchanged) {
        skipped.push({ id: ev.id, reason: 'unchanged' });
        continue;
      }

      if (src.kind !== 'local') await throttle();
      const resolved = await src.resolve();

      if (!resolved.exemptFromLicenseAllowlist) {
        const canon = canonicalLicense(resolved.license, licenseAllowlist);
        if (!canon) {
          rejected.push({ id: ev.id, reason: `license '${resolved.license}' not in allowlist` });
          continue;
        }
      }

      if (opts.dryRun) {
        fetched.push({ id: ev.id, reason: 'would fetch (dry-run)' });
        continue;
      }

      let buf;
      if (resolved.filePath) {
        buf = readFileSync(resolved.filePath);
      } else {
        await throttle();
        buf = await downloadBuffer(resolved.downloadUrl, { userAgent });
      }

      const card = await resizeToBudget(sharpLib, buf, { ...CARD, focus: ev.image.focus });
      const detail = await resizeToBudget(sharpLib, buf, { ...DETAIL, focus: ev.image.focus });

      mkdir(publicImgDir, { recursive: true });
      writeFile(cardPath, card);
      writeFile(detailPath, detail);

      manifest[ev.id] = {
        card: `img/${ev.id}-card.webp`,
        detail: `img/${ev.id}-detail.webp`,
        alt: ev.image.alt || ev.title,
        credit: resolved.credit,
        license: resolved.license,
        licenseUrl: resolved.licenseUrl,
        sourceUrl: resolved.sourceUrl,
        sourceHash: hash,
        fetchedAt: new Date().toISOString().slice(0, 10),
      };
      fetched.push({ id: ev.id });
    } catch (err) {
      failed.push({ id: ev.id, reason: err.message });
    }
  }

  if (!opts.dryRun) {
    writeFile(`${contentDir}images.manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  const report = { fetched, skipped, rejected, failed, ranAt: new Date().toISOString() };
  if (!opts.dryRun) {
    writeFile(`${contentDir}images.report.json`, `${JSON.stringify(report, null, 2)}\n`);
  }

  const hasProblems = rejected.length > 0 || failed.length > 0;
  const exitCode = hasProblems && !opts.allowMissing ? 1 : 0;
  return { ...report, exitCode };
}

function printSummary(result) {
  console.log('');
  console.log('fetch-images summary:');
  console.log(`  fetched:  ${result.fetched.length}`);
  result.fetched.forEach((r) => console.log(`    - ${r.id}${r.reason ? ` (${r.reason})` : ''}`));
  console.log(`  skipped:  ${result.skipped.length}`);
  result.skipped.forEach((r) => console.log(`    - ${r.id} (${r.reason})`));
  console.log(`  rejected: ${result.rejected.length}`);
  result.rejected.forEach((r) => console.log(`    - ${r.id}: ${r.reason}`));
  console.log(`  failed:   ${result.failed.length}`);
  result.failed.forEach((r) => console.log(`    - ${r.id}: ${r.reason}`));
  console.log('');
}

async function main() {
  const { values } = parseArgs({
    options: {
      only: { type: 'string' },
      force: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      'allow-missing': { type: 'boolean', default: false },
    },
  });

  // sharp is a devDependency (architecture §7: never ships to the browser);
  // dry-run never resizes, so it works even without sharp installed.
  let sharpLib = null;
  if (!values['dry-run']) {
    sharpLib = (await import('sharp')).default;
  }

  const result = await run(
    { only: values.only, force: values.force, dryRun: values['dry-run'], allowMissing: values['allow-missing'] },
    { sharp: sharpLib }
  );
  printSummary(result);
  process.exit(result.exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
