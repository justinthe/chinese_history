// architecture.md §4: data.js — load() fetches content/*.json, builds
// indexes; eraAt(year), eventsIn(eraId, cats), search(q). Replaces
// src/mock-data.js: same shape, real files instead of inline constants.
//
// Exported as live ESM bindings (not a returned object the views have to
// thread through) so views keep importing `ERAS`/`EVENTS`/etc. by name,
// same as they did from mock-data.js — only the loading mechanism changed.

export const CATS = {
  dynasty: { label: 'Dynasty', icon: '👑', color: '#f4b942' },
  war: { label: 'Wars', icon: '⚔️', color: '#d63a30' },
  tech: { label: 'Tech', icon: '⚙️', color: '#58a6e0' },
  nature: { label: 'Nature', icon: '🌊', color: '#3fa67a' },
  people: { label: 'People', icon: '👤', color: '#9b59b6' },
  other: { label: 'Big news', icon: '📰', color: '#f08a5d' },
  fiction: { label: 'Fiction', icon: '📖', color: '#ef6fa8' },
};

import { fold, parseYear } from './lib/normalize.js';

export let ERAS = [];
export let EVENTS = [];
export let TOURS = { grand: [], wuxia: [] };
export let SHAPES = {};
export let WORLD = {};
export let IMAGES = {};

const FILES = ['eras.json', 'events.json', 'tour.json', 'tour-wuxia.json', 'map-shapes.json', 'world.json', 'images.manifest.json'];

/** Default reader: fetch content/*.json relative to the app base (vite.config.js `base`). */
async function fetchRead(file) {
  const base = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BASE_URL : '/';
  const res = await fetch(`${base}content/${file}`);
  if (!res.ok) throw new Error(`data.js: failed to load content/${file} (${res.status})`);
  return res.json();
}

/**
 * Loads and indexes all content. `read(file)` is injectable (tests pass a
 * node:fs reader) — defaults to fetching content/<file> under the app base.
 * Normalises the last era's `end: null` to the current year (PRD A7: "today"
 * is the build year, computed not hard-coded).
 */
export async function load(read = fetchRead) {
  const [eras, events, tour, wuxiaTour, shapes, world, images] = await Promise.all(FILES.map(read));
  const buildYear = new Date().getFullYear();
  ERAS = eras.map((e) => (e.end === null ? { ...e, end: buildYear } : e));
  EVENTS = events;
  TOURS = { grand: tour, wuxia: wuxiaTour };
  SHAPES = shapes;
  WORLD = world;
  IMAGES = images;
  return { eras: ERAS, events: EVENTS, tours: TOURS, shapes: SHAPES, world: WORLD, images: IMAGES };
}

/** Event id at a tour stop, or null when no tour is running (tourIdx -1). */
export function tourEventId(tourId, tourIdx) {
  return tourIdx >= 0 ? TOURS[tourId]?.[tourIdx]?.event ?? null : null;
}

/** "221 BCE" / "105 CE" */
export function fmtYear(y) {
  return y < 0 ? `${-y} BCE` : `${y} CE`;
}

export function catColor(c) {
  return CATS[c].color;
}

/** Era containing a year, clamped to the first/last era at the ends. */
export function eraAt(y) {
  return ERAS.find((e) => y >= e.start && y < e.end) || (y < ERAS[0].start ? ERAS[0] : ERAS[ERAS.length - 1]);
}

/** Events in an era matching the category filter. eraId === null means "all eras" (timeline's set). */
export function eventsIn(eraId, cats) {
  return EVENTS.filter((e) => (eraId === null || e.era === eraId) && cats.has(e.category));
}

/**
 * Up to 6 hits: events by title/hanzi/pinyin (diacritic- and case-insensitive),
 * plus a year-jump hit per era containing that year ("221 BCE" / "-221" / "1368").
 */
export function search(q) {
  const query = fold(q.trim());
  if (!query) return [];
  const hits = EVENTS.filter(
    (ev) => fold(ev.title).includes(query) || fold(ev.hanzi).includes(query) || fold(ev.pinyin).includes(query)
  ).map((ev) => ({ id: ev.id, label: ev.title, icon: ev.icon }));

  const yr = parseYear(query);
  if (yr !== null) {
    ERAS.filter((er) => yr >= er.start && yr < er.end).forEach((er) => {
      hits.push({ id: null, year: yr, label: `Jump to ${fmtYear(yr)} (${er.name})`, icon: '📍' });
    });
  }
  return hits.slice(0, 6);
}
