// architecture.md §4: search.js — mount(el); consumes state, data;
// consumes detail.js to open a matched event (storyboard Screen 6).
import { search } from '../data.js';
import { set } from '../state.js';
import { el } from '../dom.js';
import { open as openEvent } from './detail.js';

export function mount(root) {
  const wrap = el('div', 'search');
  const input = el('input');
  input.id = 'q';
  input.placeholder = 'Search name or year…';
  input.autocomplete = 'off';
  const results = el('div', 'search-results');

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) {
      results.style.display = 'none';
      return;
    }
    const hits = search(q);

    results.textContent = '';
    if (!hits.length) {
      results.append(el('div', null, 'No match'));
    } else {
      hits.forEach((h) => {
        const row = el('div', null, `${h.icon} ${h.label}`);
        row.addEventListener('click', () => pick(h));
        results.append(row);
      });
    }
    results.style.display = 'block';
  });

  const onDocClick = (e) => {
    if (!wrap.contains(e.target)) closeResults();
  };
  document.addEventListener('click', onDocClick);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeResults();
  });

  function closeResults() {
    results.style.display = 'none';
    input.value = '';
  }

  function pick(h) {
    closeResults();
    if (h.id) openEvent(h.id);
    else set({ year: h.year });
  }

  wrap.append(input, results);
  root.append(wrap);

  return () => document.removeEventListener('click', onDocClick);
}
