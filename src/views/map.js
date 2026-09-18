// architecture.md §4: map.js — mount(el), morphTo(shapeKey, color).
import { SHAPES, TOUR, fmtYear, eraAt, catColor, eventsIn } from '../data.js';
import { get, subscribe } from '../state.js';
import { el, toast } from '../dom.js';
import { open as openEvent } from './detail.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

let territoryEl, pinsEl, capitalEl, eraNameEl, eraHanziEl, eraLineEl, eraCapEl, yearBadgeEl;
// SHAPES is empty until data.js's load() resolves (main.js awaits it before
// mount), so this can't read SHAPES.qin at module-eval time like the old
// mock-data.js version did — resolved lazily in mount() instead.
let curShape = null;
let lastEraId = null;
let morphRaf;

function svgEl(tag, attrs) {
  const n = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
}

// Static background chrome (waves, land, rivers) — never contains data, so a
// template is simpler than building it node by node. The 3 dynamic pieces
// (territory/pins/capital) are still real elements, grabbed below by id; the
// 4 background shapes' `d` attributes come from content/map-shapes.json
// (architecture.md §3 MapShape: `land`, `korea`, `japan`, `rivers`), set in
// mount() below instead of hardcoded here.
const MAP_SVG = `
  <svg viewBox="0 0 600 500" preserveAspectRatio="xMidYMid meet" id="map">
    <defs>
      <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
        <path d="M0 10 Q10 0 20 10 T40 10" fill="none" stroke="#b9d9ea" stroke-width="2"/>
      </pattern>
    </defs>
    <rect width="600" height="500" fill="url(#waves)"/>
    <path id="bg-land" fill="#f6e2b4" stroke="#e2c88f" stroke-width="3" d=""/>
    <path id="bg-korea" fill="#f6e2b4" stroke="#e2c88f" stroke-width="3" d=""/>
    <path id="bg-japan" fill="#f6e2b4" stroke="#e2c88f" stroke-width="3" d=""/>
    <path id="bg-rivers" d="" fill="none" stroke="#9cc7e0" stroke-width="4" stroke-linecap="round"/>
    <polygon id="territory" fill="#e4493f" fill-opacity=".45" stroke="#e4493f" stroke-width="4" stroke-linejoin="round" points=""/>
    <g id="pins"></g>
    <g id="capital"></g>
  </svg>`;

export function mount(root) {
  const wrap = el('div', 'mapwrap');
  wrap.innerHTML = MAP_SVG;
  wrap.querySelector('#bg-land').setAttribute('d', SHAPES.land);
  wrap.querySelector('#bg-korea').setAttribute('d', SHAPES.korea);
  wrap.querySelector('#bg-japan').setAttribute('d', SHAPES.japan);
  wrap.querySelector('#bg-rivers').setAttribute('d', SHAPES.rivers);
  curShape = SHAPES.qin.slice();
  territoryEl = wrap.querySelector('#territory');
  territoryEl.setAttribute('points', curShape.join(' '));
  pinsEl = wrap.querySelector('#pins');
  capitalEl = wrap.querySelector('#capital');

  const eraLabel = el('div', 'era-label');
  const h2 = el('h2');
  eraNameEl = el('span', null, '');
  eraHanziEl = el('span', 'hanzi', '');
  h2.append(eraNameEl, eraHanziEl);
  eraLineEl = el('p');
  const capLine = el('p');
  capLine.append('🏛️ Capital: ', (eraCapEl = el('b')));
  eraLabel.append(h2, eraLineEl, capLine);

  yearBadgeEl = el('div', 'year-badge');

  const legend = el('div', 'legend');
  ['⭐ capital', '⚔️ war', '🌊 disaster', '👤 figure', '⚙️ tech'].forEach((t) => legend.append(el('span', null, t)));

  const controls = el('div', 'map-controls');
  const zoomIn = el('button', 'btn ghost sm', '＋');
  zoomIn.addEventListener('click', () => toast('Mockup: would zoom map'));
  const zoomOut = el('button', 'btn ghost sm', '－');
  zoomOut.addEventListener('click', () => toast('Mockup: would zoom map'));
  controls.append(zoomIn, zoomOut);

  wrap.append(eraLabel, yearBadgeEl, legend, controls);
  root.append(wrap);

  lastEraId = null;
  const unsubscribe = subscribe(render);
  render();
  return unsubscribe;
}

function render() {
  if (!territoryEl) return;
  const { year, cats, eventId, tourIdx } = get();
  const era = eraAt(year);
  const highlightId = eventId || (tourIdx >= 0 ? TOUR[tourIdx]?.event : null);

  yearBadgeEl.textContent = fmtYear(year);
  eraNameEl.textContent = era.name;
  eraHanziEl.textContent = era.hanzi;
  eraLineEl.textContent = era.oneLiner + (era.legendary ? ' ✨ Legendary era.' : '');
  eraCapEl.textContent = era.capital;

  if (era.id !== lastEraId) {
    lastEraId = era.id;
    morphTo(SHAPES[era.shape], era.color);
  }
  renderPins(era, cats, highlightId);
}

function renderPins(era, cats, highlightId) {
  pinsEl.textContent = '';
  const events = eventsIn(era.id, cats);
  if (!events.length) {
    pinsEl.append(svgEl('text', { x: 300, y: 460, 'text-anchor': 'middle', 'font-size': 15, class: 'map-empty' }));
    pinsEl.lastChild.textContent = 'No events in this era for the selected categories. Turn on more chips above.';
  } else {
    events.forEach((ev) => {
      const g = svgEl('g', { class: 'pin' + (highlightId === ev.id ? ' glow' : '') });
      g.append(
        svgEl('circle', { cx: ev.xy[0], cy: ev.xy[1], r: 16, fill: '#fff', stroke: catColor(ev.category), 'stroke-width': 3 })
      );
      const txt = svgEl('text', { x: ev.xy[0], y: ev.xy[1] + 7, 'text-anchor': 'middle', 'font-size': 20 });
      txt.textContent = ev.icon;
      g.append(txt);
      g.addEventListener('click', () => openEvent(ev.id));
      pinsEl.append(g);
    });
  }
  capitalEl.textContent = '';
  const star = svgEl('text', { x: era.capitalXY[0], y: era.capitalXY[1] - 22, 'text-anchor': 'middle', 'font-size': 22 });
  star.textContent = '⭐';
  capitalEl.append(star);
}

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function morphTo(target, color) {
  cancelAnimationFrame(morphRaf);
  territoryEl.setAttribute('fill', color);
  territoryEl.setAttribute('stroke', color);
  if (reduceMotion()) {
    curShape = target.slice();
    territoryEl.setAttribute('points', curShape.join(' '));
    return;
  }
  const from = curShape.slice();
  const t0 = performance.now();
  const dur = 600;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    curShape = from.map((v, i) => v + (target[i] - v) * e);
    territoryEl.setAttribute('points', curShape.join(' '));
    if (k < 1) morphRaf = requestAnimationFrame(step);
  };
  morphRaf = requestAnimationFrame(step);
}
