#!/usr/bin/env node
// PRD.md §5 F8 / architecture.md §3: validates content/*.json before every
// build (npm run build = validate then vite build). Exports validate(db) so
// tests/validate.test.js can feed broken fixtures without touching disk.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATS } from '../src/data.js';
import { coverage, printReport } from './coverage.mjs';

const CONTENT_DIR = fileURLToPath(new URL('../content/', import.meta.url));
const CATEGORIES = Object.keys(CATS);

// architecture.md §4: CC BY-SA requires attribution + "share alike" —
// About's credits section (src/views/about.js) must literally carry this
// word whenever any manifest image ships under a BY-SA license (rule 12).
export const SA_NOTICE = 'ShareAlike';

const ERA_REQUIRED = ['id', 'name', 'hanzi', 'start', 'end', 'color', 'capital', 'capitalXY', 'shape', 'oneLiner'];
const EVENT_REQUIRED = [
  'id', 'title', 'hanzi', 'pinyin', 'year', 'era', 'category', 'icon', 'body', 'whyItMatters', 'xy', 'related',
];

// Real historical nuance, not a data-entry slip — see tasks/lessons.md
// ("Phase 02" lesson 3) and the phase-02 test this rule replaces
// (tests/mock-data.test.js). Keep the citation whenever adding an exception.
const KNOWN_HISTORICAL_EXCEPTIONS = {
  redcliffs: 'Battle of Red Cliffs (208 CE) caused the Han collapse, 12y before the conventional 220 CE Three Kingdoms start (Cao Pi’s usurpation).',
  revolution: 'Xinhai Revolution began Oct 1911; the Republic of China was declared Jan 1912.',
  'li-zicheng-beijing': 'Li Zicheng took Beijing and Ming fell in 1644, the exact year Qing (era start 1644) begins — a real same-year regime change, not a data error.',
};

/** Recursively checks every string value (any depth, objects/arrays) for a literal `<`. */
function findAngleBracket(value, path, errors) {
  if (typeof value === 'string') {
    if (value.includes('<')) errors.push(`${path}: contains '<' — no HTML allowed in content`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => findAngleBracket(v, `${path}[${i}]`, errors));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => findAngleBracket(v, `${path}.${k}`, errors));
  }
}

/** Runs every PRD F8 / architecture §3 rule against loaded content. Returns an array of error strings (empty = valid). */
export function validate({ eras, events, tour, shapes, world, images = {}, aboutSrc = '' }) {
  const errors = [];
  const eraIds = new Set(eras.map((e) => e.id));
  const eventIds = new Set(events.map((e) => e.id));

  // 1. required fields
  eras.forEach((e) => {
    ERA_REQUIRED.forEach((f) => {
      if (e[f] === undefined) errors.push(`era ${e.id ?? '?'}: missing required field '${f}'`);
    });
  });
  events.forEach((ev) => {
    EVENT_REQUIRED.forEach((f) => {
      if (ev[f] === undefined) errors.push(`event ${ev.id ?? '?'}: missing required field '${f}'`);
    });
  });

  // 2. category enum
  events.forEach((ev) => {
    if (ev.category !== undefined && !CATEGORIES.includes(ev.category)) {
      errors.push(`event ${ev.id}: unknown category '${ev.category}' (expected one of ${CATEGORIES.join(', ')})`);
    }
  });

  // 3 + 4. era resolves, year within era range (except documented exceptions)
  events.forEach((ev) => {
    if (ev.era === undefined) return;
    const era = eras.find((e) => e.id === ev.era);
    if (!era) {
      errors.push(`event ${ev.id}: era '${ev.era}' does not exist`);
      return;
    }
    if (KNOWN_HISTORICAL_EXCEPTIONS[ev.id]) return;
    const end = era.end === null ? Infinity : era.end;
    if (!(ev.year >= era.start && ev.year < end)) {
      errors.push(`event ${ev.id} (${ev.year}): outside era '${era.id}' range [${era.start}, ${era.end ?? 'now'})`);
    }
  });

  // 5. related ids resolve
  events.forEach((ev) => {
    (ev.related || []).forEach((r) => {
      if (!eventIds.has(r)) errors.push(`event ${ev.id}: related id '${r}' does not resolve`);
    });
  });

  // 6. unique ids
  if (eraIds.size !== eras.length) errors.push('eras.json: duplicate era id');
  if (eventIds.size !== events.length) errors.push('events.json: duplicate event id');

  // 7. no '<' in any content string
  findAngleBracket(eras, 'eras.json', errors);
  findAngleBracket(events, 'events.json', errors);
  findAngleBracket(tour, 'tour.json', errors);

  // 8. tour event ids resolve
  tour.forEach((stop, i) => {
    if (!eventIds.has(stop.event)) errors.push(`tour.json[${i}]: event id '${stop.event}' does not resolve`);
  });

  // 9. era.shape resolves in map-shapes.json and is 16 numbers
  eras.forEach((e) => {
    const shape = shapes[e.shape];
    if (!shape) {
      errors.push(`era ${e.id}: shape '${e.shape}' not found in map-shapes.json`);
    } else if (!(Array.isArray(shape) && shape.length === 16 && shape.every((n) => typeof n === 'number'))) {
      errors.push(`era ${e.id}: shape '${e.shape}' must be 16 numbers (8 points), got ${JSON.stringify(shape).slice(0, 60)}`);
    }
  });

  // 10. last era end: null, every other era an int
  eras.forEach((e, i) => {
    const isLast = i === eras.length - 1;
    if (isLast && e.end !== null) errors.push(`era ${e.id}: last era must have end: null (build-year today, PRD A7)`);
    if (!isLast && !Number.isInteger(e.end)) errors.push(`era ${e.id}: end must be an int (only the last era uses null)`);
  });

  // 11. every era has a "meanwhile in the world" line
  eras.forEach((e) => {
    if (typeof world[e.id] !== 'string' || !world[e.id]) errors.push(`era ${e.id}: missing world.json entry`);
  });

  // 12. any CC BY-SA manifest image requires the ShareAlike notice on About
  // (architecture §4: "CC BY-SA images require the About page to carry the
  // SA notice; validate checks this once any BY-SA image exists")
  const hasBySa = Object.values(images).some((img) => /BY-SA/i.test(img.license || ''));
  if (hasBySa && !aboutSrc.includes(SA_NOTICE)) {
    errors.push(`images.manifest.json: a CC BY-SA image exists but About page is missing the '${SA_NOTICE}' notice`);
  }

  return errors;
}

function readJSON(file) {
  return JSON.parse(readFileSync(`${CONTENT_DIR}${file}`, 'utf8'));
}

const ABOUT_SRC = fileURLToPath(new URL('../src/views/about.js', import.meta.url));

function main() {
  const db = {
    eras: readJSON('eras.json'),
    events: readJSON('events.json'),
    tour: readJSON('tour.json'),
    shapes: readJSON('map-shapes.json'),
    world: readJSON('world.json'),
    images: readJSON('images.manifest.json'),
    aboutSrc: readFileSync(ABOUT_SRC, 'utf8'),
  };
  const errors = validate(db);
  if (errors.length) {
    console.error(`validate: ${errors.length} error(s) in content/*.json:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`validate: OK — ${db.eras.length} eras, ${db.events.length} events, ${db.tour.length} tour stops`);
  printReport(coverage(db)); // phase-10: warnings only, never affects exit code
}

if (import.meta.url === `file://${process.argv[1]}`) main();
