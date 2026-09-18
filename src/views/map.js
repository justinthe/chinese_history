// architecture.md §4: map.js — mount(el), morphTo(shapeKey, color).
import { CATS, SHAPES, TOUR, fmtYear, eraAt, catColor, eventsIn } from '../data.js';
import { get, subscribe } from '../state.js';
import { el } from '../dom.js';
import { open as openEvent } from './detail.js';
import { tween } from '../lib/tween.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VB_W = 600, VB_H = 500;
const ZOOM_MIN = 1, ZOOM_MAX = 2, ZOOM_STEP = 0.5;

let mapSvgEl, territoryEl, pinsEl, capitalEl, eraNameEl, eraHanziEl, eraLineEl, eraCapEl, yearBadgeEl;
// SHAPES is empty until data.js's load() resolves (main.js awaits it before
// mount), so this can't read SHAPES.qin at module-eval time like the old
// mock-data.js version did — resolved lazily in mount() instead.
let curShape = null;
let lastEraId = null;
let stopMorph = () => {};
let curZoom = ZOOM_MIN;

function svgEl(tag, attrs) {
  const n = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
}

/**
 * Nudges pins that fall within `minDist` px of an already-placed pin apart,
 * along the vector between them, clamped inside the map viewBox. Pure, no
 * DOM. O(n²) over the ≤ ~15 pins a single era ever has —
 * ponytail: simple relaxation, revisit with a spatial grid only if an era
 * ever needs 100s of pins at once.
 */
export function spreadPins(events, minDist = 24) {
  const placed = [];
  const out = events.map((ev, i) => {
    let [px, py] = ev.xy;
    // Push away from the *nearest* violator each pass (not just the first
    // found) so settling against one placed pin can't leave it still
    // overlapping another; enough passes to fully untangle a crowded era.
    for (let iter = 0; iter < 30; iter++) {
      let collider = null, minD = minDist;
      for (const p of placed) {
        const d = Math.hypot(p.px - px, p.py - py);
        if (d < minD) { minD = d; collider = p; }
      }
      if (!collider) break;
      let dx = px - collider.px, dy = py - collider.py;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.01) {
        const angle = (i * 2.399963) % (Math.PI * 2); // golden-angle spread for exact overlaps
        dx = Math.cos(angle);
        dy = Math.sin(angle);
      } else {
        dx /= dist;
        dy /= dist;
      }
      px = collider.px + dx * minDist;
      py = collider.py + dy * minDist;
    }
    px = Math.max(20, Math.min(VB_W - 20, px));
    py = Math.max(20, Math.min(VB_H - 20, py));
    const placedPin = { ...ev, px, py };
    placed.push(placedPin);
    return placedPin;
  });
  return out;
}

/** viewBox string for a 1×–2× scale centred on the territory polygon's centroid, clamped to the map frame. */
export function viewBoxFor(points, zoom) {
  const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
  const xs = points.filter((_, i) => i % 2 === 0);
  const ys = points.filter((_, i) => i % 2 === 1);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  const w = VB_W / z, h = VB_H / z;
  const minX = Math.max(0, Math.min(VB_W - w, cx - w / 2));
  const minY = Math.max(0, Math.min(VB_H - h, cy - h / 2));
  return `${minX} ${minY} ${w} ${h}`;
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
  mapSvgEl = wrap.querySelector('#map');
  curShape = SHAPES[eraAt(get().year).shape].slice();
  territoryEl = wrap.querySelector('#territory');
  territoryEl.setAttribute('points', curShape.join(' '));
  pinsEl = wrap.querySelector('#pins');
  capitalEl = wrap.querySelector('#capital');
  curZoom = ZOOM_MIN; // MAP_SVG's viewBox="0 0 600 500" already matches 1x, no reset needed

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
  legend.append(el('span', null, '⭐ capital'));
  Object.values(CATS).forEach((c) => legend.append(el('span', null, `${c.icon} ${c.label}`)));

  const controls = el('div', 'map-controls');
  const zoomIn = el('button', 'btn ghost sm', '＋');
  zoomIn.setAttribute('aria-label', 'Zoom map in');
  zoomIn.addEventListener('click', () => applyZoom(curZoom + ZOOM_STEP));
  const zoomOut = el('button', 'btn ghost sm', '－');
  zoomOut.setAttribute('aria-label', 'Zoom map out');
  zoomOut.addEventListener('click', () => applyZoom(curZoom - ZOOM_STEP));
  controls.append(zoomIn, zoomOut);

  wrap.append(eraLabel, yearBadgeEl, legend, controls);
  root.append(wrap);

  lastEraId = null;
  const unsubscribe = subscribe(render);
  render();
  return () => {
    unsubscribe();
    stopMorph();
  };
}

function applyZoom(zoom) {
  curZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
  mapSvgEl.setAttribute('viewBox', viewBoxFor(curShape, curZoom));
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
    morphTo(era.shape, era.color); // keeps the viewBox current via its onFrame; applyZoom() covers zoom clicks
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
    spreadPins(events).forEach((ev) => {
      const g = svgEl('g', {
        class: 'pin' + (highlightId === ev.id ? ' glow' : ''),
        tabindex: '0',
        role: 'button',
        'aria-label': `${ev.title}, ${fmtYear(ev.year)}, ${CATS[ev.category].label}`,
      });
      g.append(
        svgEl('circle', { cx: ev.px, cy: ev.py, r: 16, fill: '#fff', stroke: catColor(ev.category), 'stroke-width': 3 })
      );
      const txt = svgEl('text', { x: ev.px, y: ev.py + 7, 'text-anchor': 'middle', 'font-size': 20 });
      txt.textContent = ev.icon;
      g.append(txt);
      g.addEventListener('click', () => openEvent(ev.id));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEvent(ev.id);
        }
      });
      pinsEl.append(g);
    });
  }
  capitalEl.textContent = '';
  const star = svgEl('text', { x: era.capitalXY[0], y: era.capitalXY[1] - 22, 'text-anchor': 'middle', 'font-size': 22 });
  star.textContent = '⭐';
  capitalEl.append(star);
}

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** architecture.md §4 contract: morphTo(shapeKey, color) — shapeKey indexes content/map-shapes.json. */
export function morphTo(shapeKey, color) {
  const target = SHAPES[shapeKey];
  if (!target) return;
  stopMorph();
  territoryEl.setAttribute('fill', color);
  territoryEl.setAttribute('stroke', color);
  stopMorph = tween(curShape, target, {
    reduced: reduceMotion(),
    onFrame(points) {
      curShape = points;
      territoryEl.setAttribute('points', curShape.join(' '));
      mapSvgEl.setAttribute('viewBox', viewBoxFor(curShape, curZoom));
    },
  });
}
