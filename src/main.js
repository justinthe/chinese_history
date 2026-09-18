import { load } from './data.js';
import { set, fromHash } from './state.js';
import * as router from './router.js';
import * as detail from './views/detail.js';

// Async IIFE, not top-level await: vite's default build target predates it.
(async () => {
  try {
    await load();
    set(fromHash());
  } catch (err) {
    document.getElementById('app').textContent = 'Failed to load content. Please reload the page.';
    console.error(err);
    return;
  }

  // detail.js is a global overlay (scrim + slide-in panel) that can open over
  // any screen, so it's mounted once here rather than swapped by the router.
  detail.mount(document.body);
  router.mount(document.getElementById('app'));

  document.documentElement.dataset.app = 'ready';
})();
