// architecture.md §4: router.js — mount(root); state, all views.
import { get, set, subscribe } from './state.js';
import * as landing from './views/landing.js';
import * as explore from './views/explore.js';
import * as about from './views/about.js';

const views = { landing, explore, about };
let root = null;
let lastScreen = null;
let cleanup = null;

export function mount(rootEl) {
  root = rootEl;
  render();
  subscribe((s) => {
    if (s.screen !== lastScreen) render();
  });
}

/** Navigate to a top-level screen. Leaving explore always ends any running tour. */
export function go(screen) {
  const patch = { screen };
  if (screen !== 'explore' && get().tourIdx !== -1) patch.tourIdx = -1;
  set(patch);
}

function render() {
  const { screen } = get();
  lastScreen = screen;
  cleanup?.();
  const view = views[screen] || views.landing;
  root.textContent = '';
  cleanup = view.mount(root) || null;
}
