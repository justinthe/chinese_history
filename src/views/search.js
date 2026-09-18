// architecture.md §4/§2: search.js — mount(el); "filter chips + search box".
// Consumes state, data; consumes detail.js to open a matched event
// (storyboard Screen 6). Chips moved here from explore.js in phase 07 to
// match architecture.md §2's module ownership.
import { CATS, search } from '../data.js';
import { get, set, subscribe } from '../state.js';
import { el, toast, textOn } from '../dom.js';
import { open as openEvent } from './detail.js';

/** Pure: next cats Set after toggling `k`, or null if that would turn off the last chip. */
export function nextCats(cats, k) {
  if (cats.has(k) && cats.size === 1) return null;
  const next = new Set(cats);
  next.has(k) ? next.delete(k) : next.add(k);
  return next;
}

export function mount(root) {
  const wrap = el('div', 'search');
  const chipsEl = el('div', 'chips');

  const input = el('input');
  input.id = 'q';
  input.placeholder = 'Search name or year…';
  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', 'search-listbox');

  const results = el('div', 'search-results');
  results.id = 'search-listbox';
  results.setAttribute('role', 'listbox');
  results.style.display = 'none';

  let hits = [];
  let activeIdx = -1;

  function renderResults() {
    results.textContent = '';
    if (!hits.length) {
      const empty = el('div', null, 'No match');
      empty.setAttribute('role', 'presentation'); // a plain row isn't a valid child of role="listbox"
      results.append(empty);
    } else {
      hits.forEach((h, i) => {
        const row = el('div', null, `${h.icon} ${h.label}`);
        row.id = `search-opt-${i}`;
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', String(i === activeIdx));
        row.classList.toggle('active', i === activeIdx);
        row.addEventListener('click', () => pick(h));
        results.append(row);
      });
    }
  }

  function openResults() {
    results.style.display = 'block';
    input.setAttribute('aria-expanded', 'true');
  }

  function closeResults() {
    results.style.display = 'none';
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    hits = [];
    activeIdx = -1;
  }

  function setActive(i) {
    activeIdx = i;
    if (i === -1) input.removeAttribute('aria-activedescendant');
    else input.setAttribute('aria-activedescendant', `search-opt-${i}`);
    renderResults();
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) return closeResults();
    hits = search(q);
    activeIdx = -1;
    renderResults();
    openResults();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeResults();
      input.value = '';
    } else if (e.key === 'ArrowDown' && hits.length) {
      e.preventDefault();
      setActive((activeIdx + 1) % hits.length);
    } else if (e.key === 'ArrowUp' && hits.length) {
      e.preventDefault();
      setActive((activeIdx - 1 + hits.length) % hits.length);
    } else if (e.key === 'Enter' && hits.length) {
      e.preventDefault();
      pick(hits[activeIdx === -1 ? 0 : activeIdx]);
    }
  });

  const onDocClick = (e) => {
    if (!wrap.contains(e.target)) closeResults();
  };
  document.addEventListener('click', onDocClick);

  function pick(h) {
    closeResults();
    input.value = '';
    if (h.id) openEvent(h.id);
    else set({ year: h.year });
  }

  function renderChips() {
    const { cats } = get();
    chipsEl.textContent = '';
    Object.entries(CATS).forEach(([k, c]) => {
      const chip = el('button', 'chip' + (cats.has(k) ? ' on' : ''), `${c.icon} ${c.label}`);
      chip.style.background = c.color;
      chip.style.color = textOn(c.color);
      chip.setAttribute('aria-pressed', String(cats.has(k)));
      chip.addEventListener('click', () => toggleCat(k));
      chipsEl.append(chip);
    });
  }

  function toggleCat(k) {
    const next = nextCats(get().cats, k);
    if (next === null) return toast('Keep at least one category on');
    set({ cats: next });
  }

  renderChips();
  const unsubscribeChips = subscribe(renderChips);

  wrap.append(input, results);
  root.append(chipsEl, wrap);

  return () => {
    unsubscribeChips();
    document.removeEventListener('click', onDocClick);
  };
}
