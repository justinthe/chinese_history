// architecture.md §4: explore.js (the "Screen 2" shell) — mounts timeline,
// map, detail (global, mounted by main.js), tour, search per the
// dependency graph in architecture.md §8. Chips + search box live in
// search.js (architecture.md §2 "filter chips + search box").
import { el } from '../dom.js';
import { go } from '../router.js';
import * as timeline from './timeline.js';
import * as map from './map.js';
import * as tour from './tour.js';
import * as search from './search.js';

export function mount(root) {
  const screen = el('section');
  screen.id = 'explore';
  screen.className = 'screen active';
  const section = el('div', 'explore-shell');

  screen.append(el('h1', 'sr-only', 'Explore — Middle Kingdom Explorer'));

  const topbar = el('header', 'topbar');
  const logo = el('button', 'logo', '🐉 Middle Kingdom');
  logo.addEventListener('click', () => go('landing'));
  const tourBtn = el('button', 'btn gold sm', '🎒 Grand Tour');
  tourBtn.addEventListener('click', () => tour.start());
  topbar.append(logo);
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

  return () => {
    cleanupSearch?.();
    cleanupMap?.();
    cleanupTour?.();
    cleanupTimeline?.();
  };
}
