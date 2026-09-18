// SVG icon set — missing-image fallback for the detail panel hero
// (vibe-prompts/phase-06-event-detail.md line 12), one glyph per CATS key.
// Built with createElementNS, never innerHTML (architecture.md §7 content-
// injection rule; dom.js's el() is textContent-only and can't carry SVG).
const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

// Simple stroke glyphs, 24x24 viewBox — geometric, not pixel art.
const SHAPES = {
  dynasty: () => [svgEl('path', { d: 'M4 18h16l-1-9-4 4-3-6-3 6-4-4z' })],
  war: () => [svgEl('path', { d: 'M4 4l16 16M20 4L4 20' })],
  tech: () => [svgEl('circle', { cx: 12, cy: 12, r: 5 }), svgEl('circle', { cx: 12, cy: 12, r: 1.5, fill: 'currentColor' })],
  nature: () => [svgEl('path', { d: 'M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0' })],
  people: () => [svgEl('circle', { cx: 12, cy: 8, r: 4 }), svgEl('path', { d: 'M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8' })],
  other: () => [svgEl('rect', { x: 4, y: 5, width: 16, height: 14, rx: 1 }), svgEl('path', { d: 'M7 9h10M7 13h10M7 17h6' })],
};

/** Category icon as an <svg>, 110×110 (the detail hero's only call site), stroking in currentColor. */
export function icon(catKey) {
  const svg = svgEl('svg', {
    viewBox: '0 0 24 24', width: 110, height: 110,
    fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'aria-hidden': 'true', // decorative fallback; the category is already named in a badge
  });
  svg.append(...(SHAPES[catKey] || SHAPES.other)());
  return svg;
}
