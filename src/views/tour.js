// architecture.md §4: tour.js — mount(el), start(), step(d), end(); consumes
// state, data, and detail.js ("Read more" opens the panel without leaving
// the tour, per storyboard Screen 5).
import { TOUR, EVENTS, fmtYear } from '../data.js';
import { get, set, subscribe } from '../state.js';
import { el, toast } from '../dom.js';
import { open as openEvent } from './detail.js';

let tourEl, dotsEl, titleEl, smallEl, textEl, readMoreEl, nextBtn;
let opener = null; // element to return focus to on close, same pattern as detail.js

export function mount(root) {
  tourEl = el('div', 'tour');
  tourEl.tabIndex = -1;
  tourEl.setAttribute('role', 'region');
  tourEl.setAttribute('aria-label', 'Grand Tour');

  dotsEl = el('div', 'dots');
  dotsEl.setAttribute('aria-hidden', 'true'); // "Stop N of X" text below carries the same info
  const guide = el('span', 'guide', '🐼');
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
    const stop = TOUR[get().tourIdx];
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

  tourEl.append(dotsEl, guide, h3, p, row);
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

function gotoStop(idx) {
  const stop = TOUR[idx];
  const ev = EVENTS.find((e) => e.id === stop.event);
  set({ tourIdx: idx, year: ev.year, eventId: null });
}

/** Stop to resume at: stored index if in range, else 0. Pure. */
export function resumeIdx(raw, len) {
  return Number.isInteger(raw) && raw >= 0 && raw < len ? raw : 0;
}

export function start() {
  let stored = NaN;
  try {
    stored = parseInt(localStorage.getItem('tourStop'), 10);
  } catch {
    // storage unavailable (private mode, quota, SSR) — resumeIdx falls back to 0
  }
  gotoStop(resumeIdx(stored, TOUR.length));
}

export function step(d) {
  let idx = get().tourIdx + d;
  if (idx < 0) idx = 0;
  if (idx >= TOUR.length) return end(true);
  gotoStop(idx);
}

export function end(finished) {
  set({ tourIdx: -1 });
  if (finished) toast('🎉 Tour complete! Explore freely, or search anything.');
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
  const stop = TOUR[tourIdx];
  const ev = EVENTS.find((e) => e.id === stop.event);

  dotsEl.textContent = '';
  TOUR.forEach((_, i) => dotsEl.append(el('i', i <= tourIdx ? 'done' : '')));

  titleEl.textContent = stop.title;
  smallEl.textContent = `Stop ${tourIdx + 1} of ${TOUR.length} · ${fmtYear(ev.year)}`;
  textEl.textContent = stop.text;
  nextBtn.textContent = tourIdx === TOUR.length - 1 ? 'Finish 🎉' : 'Next →';

  if (!tourEl.classList.contains('open')) {
    opener = document.activeElement;
    tourEl.classList.add('open');
    tourEl.focus();
  }
}
