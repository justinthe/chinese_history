// architecture.md §4: explore.js (the "Screen 2" shell) — mounts timeline,
// map, detail (global, mounted by main.js), tour, search per the
// dependency graph in architecture.md §8.
import { CATS } from '../data.js';
import { get, set, subscribe } from '../state.js';
import { el, toast, textOn } from '../dom.js';
import { go } from '../router.js';
import * as timeline from './timeline.js';
import * as map from './map.js';
import * as tour from './tour.js';
import * as search from './search.js';

let chipsEl;

export function mount(root) {
  const screen = el('section');
  screen.id = 'explore';
  screen.className = 'screen active';
  const section = el('div', 'explore-shell');

  const topbar = el('div', 'topbar');
  const logo = el('div', 'logo', '🐉 Middle Kingdom');
  logo.addEventListener('click', () => go('landing'));
  chipsEl = el('div', 'chips');
  const tourBtn = el('button', 'btn gold sm', '🎒 Grand Tour');
  tourBtn.addEventListener('click', () => tour.start());
  topbar.append(logo, chipsEl);
  const cleanupSearch = search.mount(topbar);
  topbar.append(tourBtn);

  const stage = el('div', 'stage');
  const maprow = el('div', 'maprow');
  const cleanupMap = map.mount(maprow);
  const cleanupTour = tour.mount(maprow);
  stage.append(maprow);
  const cleanupTimeline = timeline.mount(stage);

  section.append(topbar, stage);
  screen.append(section);
  root.append(screen);

  renderChips();
  const unsubscribeChips = subscribe(renderChips);

  return () => {
    unsubscribeChips();
    cleanupSearch?.();
    cleanupMap?.();
    cleanupTour?.();
    cleanupTimeline?.();
  };
}

function renderChips() {
  if (!chipsEl) return;
  const { cats } = get();
  chipsEl.textContent = '';
  Object.entries(CATS).forEach(([k, c]) => {
    const chip = el('button', 'chip' + (cats.has(k) ? ' on' : ''), `${c.icon} ${c.label}`);
    chip.style.background = c.color;
    chip.style.color = textOn(c.color);
    chip.addEventListener('click', () => toggleCat(k));
    chipsEl.append(chip);
  });
}

function toggleCat(k) {
  const { cats } = get();
  if (cats.has(k) && cats.size === 1) return toast('Keep at least one category on');
  const next = new Set(cats);
  next.has(k) ? next.delete(k) : next.add(k);
  set({ cats: next });
}
