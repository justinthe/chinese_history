// architecture.md §4: tour.js — mount(el), start(), step(d), end(); consumes
// state, data, and detail.js ("Read more" opens the panel without leaving
// the tour, per storyboard Screen 5).
import { TOUR, EVENTS, fmtYear } from '../data.js';
import { get, set, subscribe } from '../state.js';
import { el, toast } from '../dom.js';
import { open as openEvent } from './detail.js';

let tourEl, dotsEl, titleEl, smallEl, textEl, readMoreEl, nextBtn;

export function mount(root) {
  tourEl = el('div', 'tour');

  dotsEl = el('div', 'dots');
  const guide = el('span', 'guide', '🐼');
  const h3 = el('h3');
  titleEl = document.createTextNode('');
  smallEl = el('small');
  h3.append(titleEl, smallEl);
  const p = el('p');
  textEl = document.createTextNode('');
  readMoreEl = el('a', null, 'Read more →');
  readMoreEl.href = '#';
  readMoreEl.style.color = 'var(--gold)';
  readMoreEl.addEventListener('click', (e) => {
    e.preventDefault();
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

  const unsubscribe = subscribe(render);
  render();
  return unsubscribe;
}

function gotoStop(idx) {
  const stop = TOUR[idx];
  const ev = EVENTS.find((e) => e.id === stop.event);
  set({ tourIdx: idx, year: ev.year, eventId: null });
}

export function start() {
  gotoStop(0);
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
    tourEl.classList.remove('open');
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

  tourEl.classList.add('open');
}
