// architecture.md §4: timeline.js — mount(el), scrollToYear(y), zoom(f), pan(dir).
// Owns the "Meanwhile in the world" strip too (F7): it's laid out inside the
// timeline pane and there's no separate module for it in architecture §1/§8.
import { ERAS, TOUR, WORLD, fmtYear, eraAt, catColor, eventsIn } from '../data.js';
import { get, set, subscribe, YEAR_MIN, YEAR_MAX, clampPxPerYear } from '../state.js';
import { el, textOn, reduceMotion } from '../dom.js';
import { open as openEvent } from './detail.js';
import { assignLanes } from '../lib/lanes.js';

const CARD_WIDTH = 128; // matches .ev width in styles.css
const CARD_PITCH = 34; // 32px card + 2px gap
const BOTTOM_ZONE = 74; // band (34) + tick (30) + margin — reserved for lanes-from-height calc
const TOP_ZONE = 40; // .tl-tools floats over the top-right of the scrollable area — keep lane 0 clear of it

let tlScrollEl, tlInnerEl, playheadEl, meanwhileEl;
let lastLayoutKey = null;
let bandEls = []; // [{ el, eraId }]
let cardEls = []; // [{ el, id }] — placed cards
let clusterEls = []; // [{ el, ids }] — "+N" chips

export function mount(root) {
  const timelineEl = el('div', 'timeline');

  const tools = el('div', 'tl-tools');
  const leftBtn = el('button', 'wide', '◀');
  leftBtn.title = leftBtn.ariaLabel = 'Scroll left';
  leftBtn.addEventListener('click', () => pan(-1));
  const rightBtn = el('button', 'wide', '▶');
  rightBtn.title = rightBtn.ariaLabel = 'Scroll right';
  rightBtn.addEventListener('click', () => pan(1));
  const zoomInBtn = el('button', null, '＋');
  zoomInBtn.title = zoomInBtn.ariaLabel = 'Zoom in';
  zoomInBtn.addEventListener('click', () => zoom(1.5));
  const zoomOutBtn = el('button', null, '－');
  zoomOutBtn.title = zoomOutBtn.ariaLabel = 'Zoom out';
  zoomOutBtn.addEventListener('click', () => zoom(1 / 1.5));
  tools.append(leftBtn, rightBtn, zoomInBtn, zoomOutBtn);

  tlScrollEl = el('div', 'tl-scroll');
  tlInnerEl = el('div', 'tl-inner');
  playheadEl = el('div', 'playhead');
  playheadEl.setAttribute('role', 'slider');
  playheadEl.tabIndex = 0;
  playheadEl.setAttribute('aria-label', 'Year');
  playheadEl.setAttribute('aria-valuemin', String(YEAR_MIN));
  playheadEl.setAttribute('aria-valuemax', String(YEAR_MAX));
  tlInnerEl.append(playheadEl);
  tlScrollEl.append(tlInnerEl);

  const meanwhileRow = el('div', 'meanwhile');
  meanwhileRow.append(document.createTextNode('🌍 '), el('b', null, 'Meanwhile in the world:'), (meanwhileEl = el('span')));

  timelineEl.append(tools, tlScrollEl, meanwhileRow);
  root.append(timelineEl);

  const drag = { dragged: false };
  const cleanupDrag = installDrag(tlScrollEl, drag);

  tlScrollEl.addEventListener('click', (e) => {
    if (drag.dragged) { drag.dragged = false; return; }
    if (e.target.closest('.ev, .ev-more')) return; // card/cluster clicks handle their own action
    const rect = tlInnerEl.getBoundingClientRect();
    const y = Math.round((e.clientX - rect.left) / get().pxPerYear + YEAR_MIN);
    set({ year: Math.max(YEAR_MIN, Math.min(YEAR_MAX, y)) });
  });

  /** Arrow keys move the playhead ±25y — only while Explore is active, no panel open, not typing. */
  const onKeydown = (e) => {
    const s = get();
    if (s.screen !== 'explore' || s.eventId || document.activeElement?.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') set({ year: Math.min(YEAR_MAX, s.year + 25) });
    if (e.key === 'ArrowLeft') set({ year: Math.max(YEAR_MIN, s.year - 25) });
  };
  document.addEventListener('keydown', onKeydown);

  const unsubscribe = subscribe(render);
  lastLayoutKey = null; // force a full layout on first render
  render();
  // tlScrollEl was just appended — clientWidth/clientHeight are still 0 until
  // the browser lays it out, so centering/lane-count now would use garbage
  // measurements (tasks/lessons.md, phase 02).
  requestAnimationFrame(() => {
    lastLayoutKey = null;
    render();
    scrollToYear(get().year, true);
  });

  // Router swaps screens by replacing DOM, not by calling an unmount — the
  // window/document listeners and the state subscription below would
  // otherwise outlive this screen. Return a cleanup so the router tears it down.
  return () => {
    unsubscribe();
    cleanupDrag();
    document.removeEventListener('keydown', onKeydown);
  };
}

function installDrag(sc, drag) {
  let start = null;
  const onMove = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 5) drag.dragged = true;
    sc.scrollLeft = start.left - dx;
  };
  const onUp = () => {
    start = null;
    sc.classList.remove('dragging');
  };
  sc.addEventListener('mousedown', (e) => {
    start = { x: e.clientX, left: sc.scrollLeft };
    drag.dragged = false;
    sc.classList.add('dragging');
  });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  sc.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        // Firefox reports deltaMode 1 (DOM_DELTA_LINE) — a raw deltaY there
        // is ~3px/notch instead of Chrome's ~100px. Scale lines to pixels.
        sc.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      }
    },
    { passive: false }
  );
  return () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
}

export function pan(dir) {
  tlScrollEl.scrollBy({ left: dir * tlScrollEl.clientWidth * 0.6, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

export function zoom(f) {
  const pxPerYear = clampPxPerYear(get().pxPerYear * f, tlScrollEl.clientWidth);
  set({ pxPerYear });
  scrollToYear(get().year, true);
}

export function scrollToYear(y, instant) {
  const { pxPerYear } = get();
  tlScrollEl.scrollTo({
    left: (y - YEAR_MIN) * pxPerYear - tlScrollEl.clientWidth / 2,
    behavior: instant || reduceMotion() ? 'auto' : 'smooth',
  });
}

/** Lane count from measured pane height, capped 2–4 (mobile's shorter pane degrades gracefully). */
function laneCount() {
  const h = tlScrollEl.clientHeight;
  if (!h) return 4;
  return Math.max(2, Math.min(4, Math.floor((h - BOTTOM_ZONE - TOP_ZONE) / CARD_PITCH)));
}

function tickStep(pxPerYear) {
  if (pxPerYear < 0.3) return 500;
  if (pxPerYear < 1) return 250;
  if (pxPerYear < 2) return 100;
  return 50;
}

function render() {
  if (!tlInnerEl) return;
  const { year, cats, eventId, tourIdx, pxPerYear } = get();
  const era = eraAt(year);
  const highlightId = eventId || (tourIdx >= 0 ? TOUR[tourIdx]?.event : null);

  const lanes = laneCount();
  const catsKey = [...cats].sort().join(',');
  const layoutKey = `${pxPerYear}|${catsKey}|${lanes}`;

  if (layoutKey !== lastLayoutKey) {
    lastLayoutKey = layoutKey;
    layoutFull(pxPerYear, cats, lanes);
  }

  updateCheap(year, era, highlightId, pxPerYear);
}

function layoutFull(pxPerYear, cats, lanes) {
  tlInnerEl.style.width = (YEAR_MAX - YEAR_MIN) * pxPerYear + 'px';
  tlInnerEl.querySelectorAll('.band,.tick,.ev,.ev-more,[popover]').forEach((n) => n.remove());
  const x = (y) => (y - YEAR_MIN) * pxPerYear;

  bandEls = ERAS.map((e) => {
    const b = el('button', 'band');
    b.style.left = x(e.start) + 'px';
    const w = Math.max(4, x(e.end) - x(e.start) - 2);
    b.style.width = w + 'px';
    b.style.background = e.color;
    b.style.color = textOn(e.color);
    // Hide the label when the band is narrower than an estimate of its text
    // width — cheaper than measuring a forced reflow per band.
    const label = e.name.length * 8 + 16 <= w ? e.name : '';
    b.textContent = label + (e.legendary ? ' ✨' : '');
    b.title = `${e.name} ${fmtYear(e.start)} – ${fmtYear(e.end)}`;
    b.setAttribute('aria-label', `${e.name}, ${fmtYear(e.start)} to ${fmtYear(e.end)}`);
    b.addEventListener('click', () => set({ year: e.start }));
    tlInnerEl.append(b);
    return { el: b, eraId: e.id };
  });

  const step = tickStep(pxPerYear);
  for (let y = Math.ceil(YEAR_MIN / step) * step; y <= YEAR_MAX; y += step) {
    const t = el('div', 'tick', fmtYear(y));
    t.style.left = x(y) + 'px';
    tlInnerEl.append(t);
  }

  const items = eventsIn(null, cats).map((ev) => ({ x: x(ev.year), ev }));
  const placements = assignLanes(items, { width: CARD_WIDTH, lanes });

  cardEls = [];
  clusterEls = [];
  let clusterIdx = 0;
  placements.forEach((p) => {
    if (p.more) {
      clusterIdx += 1;
      const popId = `tl-more-${clusterIdx}`;
      const chip = el('button', 'ev-more', `+${p.more.length}`);
      chip.style.left = p.x + 'px';
      chip.style.top = TOP_ZONE + p.lane * CARD_PITCH + 'px';
      chip.setAttribute('popovertarget', popId);
      chip.setAttribute('aria-label', `${p.more.length} more events`);
      chip.title = `${p.more.length} more events`;
      tlInnerEl.append(chip);

      const list = el('div', 'more-list');
      list.id = popId;
      list.setAttribute('popover', 'auto');
      p.more.forEach(({ ev }) => {
        const row = el('button', 'more-row');
        const ic = el('span', 'ic', ev.icon);
        ic.style.background = catColor(ev.category);
        row.append(ic, el('b', null, ev.title), el('small', null, fmtYear(ev.year)));
        row.addEventListener('click', () => openEvent(ev.id));
        list.append(row);
      });
      tlInnerEl.append(list);
      clusterEls.push({ el: chip, ids: p.more.map((m) => m.ev.id) });
      return;
    }

    const ev = p.ev;
    const d = el('button', 'ev');
    d.style.left = p.x + 'px';
    d.style.top = TOP_ZONE + p.lane * CARD_PITCH + 'px';
    // Explicit label — a button whose content is block-level children (`.ev b`
    // is `display:block`) doesn't reliably get a flattened subtree name.
    d.setAttribute('aria-label', `${ev.title}, ${fmtYear(ev.year)}${ev.legendary ? ', legendary' : ''}`);
    const ic = el('span', 'ic', ev.icon);
    ic.style.background = catColor(ev.category);
    const b = el('b', null, ev.title);
    if (ev.legendary) b.append(el('span', 'legend-tag', 'legend'));
    const small = el('small', null, fmtYear(ev.year));
    d.append(ic, b, small);
    d.addEventListener('click', () => openEvent(ev.id));
    tlInnerEl.append(d);
    cardEls.push({ el: d, id: ev.id });
  });
}

function updateCheap(year, era, highlightId, pxPerYear) {
  bandEls.forEach(({ el: b, eraId }) => b.classList.toggle('current', eraId === era.id));
  cardEls.forEach(({ el: c, id }) => c.classList.toggle('glow', id === highlightId));
  clusterEls.forEach(({ el: c, ids }) => c.classList.toggle('glow', ids.includes(highlightId)));

  const x = (year - YEAR_MIN) * pxPerYear;
  playheadEl.style.left = x + 'px';
  playheadEl.setAttribute('aria-valuenow', String(year));
  playheadEl.setAttribute('aria-valuetext', fmtYear(year));
  meanwhileEl.textContent = ' ' + WORLD[era.id];

  const margin = 40;
  if (x < tlScrollEl.scrollLeft + margin || x > tlScrollEl.scrollLeft + tlScrollEl.clientWidth - margin) {
    scrollToYear(year, false);
  }
}
