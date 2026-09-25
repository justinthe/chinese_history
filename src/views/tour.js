// architecture.md §4: tour.js — mount(el), start(), step(d), end(); consumes
// state, data, and detail.js ("Read more" opens the panel without leaving
// the tour, per storyboard Screen 5).
import { TOURS, EVENTS, fmtYear } from '../data.js';
import { get, set, subscribe, tourKey } from '../state.js';
import { el, toast } from '../dom.js';
import { open as openEvent } from './detail.js';

// Per-tour chrome. Stops live in content/tour.json / tour-wuxia.json (data.js TOURS).
export const TOUR_META = {
  grand: { label: 'Grand Tour', guide: '🐼', done: '🎉 Tour complete! Explore freely, or search anything.' },
  wuxia: { label: 'Wuxia Tour', guide: '🥋', done: '🎉 Wuxia Tour complete! The jianghu awaits: explore freely.' },
};

let tourEl, dotsEl, guideEl, titleEl, smallEl, textEl, readMoreEl, nextBtn;
let opener = null; // element to return focus to on close, same pattern as detail.js

export function mount(root) {
  tourEl = el('div', 'tour');
  tourEl.tabIndex = -1;
  tourEl.setAttribute('role', 'region');
  tourEl.setAttribute('aria-label', 'Grand Tour');

  dotsEl = el('div', 'dots');
  dotsEl.setAttribute('aria-hidden', 'true'); // "Stop N of X" text below carries the same info
  guideEl = el('span', 'guide', '🐼');
  const h3 = el('h3');
  titleEl = document.createTextNode('');
  smallEl = el('small');
  h3.append(titleEl, smallEl);
  const p = el('p');
  p.setAttribute('aria-live', 'polite');
  textEl = document.createTextNode('');
  readMoreEl = el('button', 'link', 'Read more →');
  readMoreEl.style.color = 'var(--gold)';
  readMoreEl.addEventListener('click', () => {
    const stop = stops()[get().tourIdx];
    if (stop) openEvent(stop.event);
  });
  p.append(textEl, ' ', readMoreEl);

  const row = el('div', 'row');
  const backBtn = el('button', 'btn ghost sm', '← Back');
  backBtn.addEventListener('click', () => step(-1));
  nextBtn = el('button', 'btn gold sm', 'Next →');
  nextBtn.addEventListener('click', () => step(1));
  const spacer = el('span', 'spacer');
  const exitBtn = el('button', 'link', 'Exit tour');
  exitBtn.addEventListener('click', () => end(false));
  row.append(backBtn, nextBtn, spacer, exitBtn);

  tourEl.append(dotsEl, guideEl, h3, p, row);
  root.append(tourEl);

  // Left/Right step, Esc exits — only while focus is inside the tour panel.
  // stopPropagation keeps timeline.js's document-level ±25y arrow handler
  // from also firing on the same keypress.
  tourEl.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'Escape') return;
    e.stopPropagation();
    if (k === 'Escape') end(false);
    else step(k === 'ArrowRight' ? 1 : -1);
  });

  const unsubscribe = subscribe(render);
  render();
  return unsubscribe;
}

/** Stops of a tour (default: the active one). */
function stops(tourId = get().tourId) {
  return TOURS[tourId] || TOURS.grand;
}

// tourId and tourIdx change in one set() so render never sees an index from the other tour.
function gotoStop(idx, tourId = get().tourId) {
  const stop = stops(tourId)[idx];
  const ev = EVENTS.find((e) => e.id === stop.event);
  set({ tourId, tourIdx: idx, year: ev.year, eventId: null });
}

/** Stop to resume at: stored index if in range, else 0. Pure. */
export function resumeIdx(raw, len) {
  return Number.isInteger(raw) && raw >= 0 && raw < len ? raw : 0;
}

/** Starts (or resumes) a tour: 'grand' or 'wuxia'. Each keeps its own resume stop. */
export function start(tourId = 'grand') {
  let stored = NaN;
  try {
    stored = parseInt(localStorage.getItem(tourKey(tourId)), 10);
  } catch {
    // storage unavailable (private mode, quota, SSR) — resumeIdx falls back to 0
  }
  gotoStop(resumeIdx(stored, stops(tourId).length), tourId);
}

export function step(d) {
  let idx = get().tourIdx + d;
  if (idx < 0) idx = 0;
  if (idx >= stops().length) return end(true);
  gotoStop(idx);
}

export function end(finished) {
  set({ tourIdx: -1 });
  if (finished) toast((TOUR_META[get().tourId] || TOUR_META.grand).done);
}

function render() {
  if (!tourEl) return;
  const { tourIdx } = get();
  if (tourIdx < 0) {
    if (tourEl.classList.contains('open')) {
      tourEl.classList.remove('open');
      if (opener?.isConnected) opener.focus();
      opener = null;
    }
    return;
  }
  const tour = stops();
  const meta = TOUR_META[get().tourId] || TOUR_META.grand;
  const stop = tour[tourIdx];
  const ev = EVENTS.find((e) => e.id === stop.event);

  tourEl.setAttribute('aria-label', meta.label);
  tourEl.classList.toggle('wuxia', get().tourId === 'wuxia');
  guideEl.textContent = meta.guide;
  dotsEl.textContent = '';
  tour.forEach((_, i) => dotsEl.append(el('i', i <= tourIdx ? 'done' : '')));

  titleEl.textContent = stop.title;
  smallEl.textContent = `Stop ${tourIdx + 1} of ${tour.length} · ${fmtYear(ev.year)}`;
  textEl.textContent = stop.text;
  nextBtn.textContent = tourIdx === tour.length - 1 ? 'Finish 🎉' : 'Next →';

  if (!tourEl.classList.contains('open')) {
    opener = document.activeElement;
    tourEl.classList.add('open');
    tourEl.focus();
  }
}
