#!/usr/bin/env node
// PRD.md §7 Success Metrics / phase-10 deliverable: a non-blocking coverage
// report wired into validate. Mirrors validate.mjs's shape — pure export +
// guarded main() — but never fails the build; warnings only.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATS } from '../src/data.js';

const CONTENT_DIR = fileURLToPath(new URL('../content/', import.meta.url));
const CATEGORIES = Object.keys(CATS);

const MIN_TOTAL = 150;
const MIN_PER_ERA = 5;
const MIN_PER_CAT = 15;
const MIN_IMAGE_PCT = 90;

/** Pure: computes coverage counts + PRD §7 / phase-10 checklist warnings. Never throws, never fails a build. */
export function coverage({ eras, events, images = {} }) {
  const perEra = {};
  eras.forEach((e) => { perEra[e.id] = 0; });
  const perCat = {};
  CATEGORIES.forEach((c) => { perCat[c] = 0; });

  events.forEach((ev) => {
    if (ev.era in perEra) perEra[ev.era] += 1;
    if (ev.category in perCat) perCat[ev.category] += 1;
  });

  const withImage = events.filter((ev) => images[ev.id]).length;
  const total = events.length;
  const imagePct = total === 0 ? 0 : Math.round((withImage / total) * 1000) / 10;

  const warnings = [];
  if (total < MIN_TOTAL) warnings.push(`only ${total} events (need >= ${MIN_TOTAL})`);
  Object.entries(perEra).forEach(([id, n]) => {
    if (n < MIN_PER_ERA) warnings.push(`era '${id}': ${n} events (need >= ${MIN_PER_ERA})`);
  });
  Object.entries(perCat).forEach(([cat, n]) => {
    if (n < MIN_PER_CAT) warnings.push(`category '${cat}': ${n} events (need >= ${MIN_PER_CAT})`);
  });
  if (imagePct < MIN_IMAGE_PCT) warnings.push(`images: ${imagePct}% of events (need >= ${MIN_IMAGE_PCT}%)`);

  return { total, perEra, perCat, withImage, imagePct, warnings };
}

function readJSON(file) {
  return JSON.parse(readFileSync(`${CONTENT_DIR}${file}`, 'utf8'));
}

function main() {
  const db = {
    eras: readJSON('eras.json'),
    events: readJSON('events.json'),
    images: readJSON('images.manifest.json'),
  };
  printReport(coverage(db));
}

/** Shared by main() and validate.mjs's post-OK summary. */
export function printReport({ total, perEra, perCat, withImage, imagePct, warnings }) {
  console.log(`coverage: ${total} events, ${withImage} with images (${imagePct}%)`);
  console.log('  per era:', Object.entries(perEra).map(([id, n]) => `${id}=${n}`).join(' '));
  console.log('  per category:', Object.entries(perCat).map(([c, n]) => `${c}=${n}`).join(' '));
  if (warnings.length) {
    console.log(`coverage: ${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  } else {
    console.log('coverage: all PRD §7 / phase-10 targets met');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
