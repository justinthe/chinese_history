// Real state store: single module-level object + subscribe list, URL hash
// sync (architecture.md §3 "Runtime state" / §4 state.js contract), and
// localStorage persistence for `tourIdx`/`cats` only (§7: "Only tourStop
// (int) and cats (string list), parsed defensively").

const Y0 = -2250, Y1 = 2030;
export const YEAR_MIN = Y0;
export const YEAR_MAX = Y1;

const ALL_CATS = ['dynasty', 'war', 'tech', 'nature', 'people', 'other'];

/** Default zoom: timeline ~2.5 screens wide (PRD F2). */
export function defaultPxPerYear(viewW = typeof window !== 'undefined' ? window.innerWidth : 1000) {
  return Math.max(0.45, (viewW * 2.5) / (YEAR_MAX - YEAR_MIN));
}

/** Clamps px/year between "fit all 4,000 years" (min) and 4 px/year (max), per PRD F2. */
export function clampPxPerYear(px, viewW) {
  const fitAll = viewW / (YEAR_MAX - YEAR_MIN);
  return Math.min(4, Math.max(fitAll, px));
}

const defaults = () => ({
  screen: 'landing',
  year: -221,
  eventId: null,
  cats: new Set(ALL_CATS),
  tourIdx: -1,
  pxPerYear: defaultPxPerYear(),
});

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode, quota, SSR) — persistence is best-effort
  }
}

function parseCatsList(raw) {
  const cats = new Set(raw.split(',').filter((c) => ALL_CATS.includes(c)));
  return cats.size ? cats : undefined;
}

/** Parses `#screen=explore&year=690&event=wuzetian&cats=war,tech` defensively. */
export function fromHash(hash = typeof location !== 'undefined' ? location.hash : '') {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const patch = {};

  const screen = params.get('screen');
  if (screen === 'landing' || screen === 'explore' || screen === 'about') patch.screen = screen;

  const year = parseInt(params.get('year'), 10);
  if (Number.isInteger(year)) patch.year = Math.max(YEAR_MIN, Math.min(YEAR_MAX, year));

  if (params.has('event')) {
    patch.eventId = params.get('event') || null;
    if (patch.eventId && !patch.screen) patch.screen = 'explore';
  }

  if (params.has('cats')) {
    const cats = parseCatsList(params.get('cats'));
    if (cats) patch.cats = cats;
  }

  return patch;
}

/** Serialises the parts of state that belong in the URL (screen, year, eventId, cats). */
export function toHash(state) {
  const params = new URLSearchParams();
  params.set('screen', state.screen);
  params.set('year', state.year);
  if (state.eventId) params.set('event', state.eventId);
  if (state.cats.size !== ALL_CATS.length) params.set('cats', [...state.cats].join(','));
  return '#' + params.toString();
}

let s = defaults();
try {
  const storedCats = typeof localStorage !== 'undefined' ? parseCatsList(localStorage.getItem('cats') || '') : undefined;
  if (storedCats) s.cats = storedCats;
} catch {
  // storage unavailable (private mode, quota, SSR) — fall back to defaults() above
}

const subscribers = new Set();

export function get() {
  return s;
}

export function set(patch) {
  s = { ...s, ...patch };
  if (typeof localStorage !== 'undefined') {
    if ('cats' in patch) writeStorage('cats', [...s.cats].join(','));
    if ('tourIdx' in patch) writeStorage('tourStop', String(s.tourIdx));
  }
  // history.replaceState never fires 'hashchange' (only user navigation /
  // location.hash assignment does), so this can't loop back into the
  // listener below.
  if (typeof history !== 'undefined') history.replaceState(null, '', toHash(s));
  subscribers.forEach((fn) => fn(s));
}

/** Returns an unsubscribe function. */
export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// ponytail: stored tourStop is readable via localStorage but not auto-applied
// on boot — resuming the tour panel itself is storyboard Screen 5 (phase 08).
// Applying it here would silently reopen the tour on every visit.
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => set(fromHash()));
}
