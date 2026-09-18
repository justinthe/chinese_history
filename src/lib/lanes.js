// architecture.md §4 / phase-04: pure sweep-line lane assignment for timeline
// cards. No DOM, no state — takes pixel-centred items, returns placements.
// Cards render with `transform: translateX(-50%)` (styles.css), so an item's
// occupied span is [x - width/2, x + width/2].

/**
 * @param {{x:number}[]} items - must carry `x` (pixel centre); any other
 *   fields pass through untouched.
 * @param {{width?:number, lanes?:number, chip?:number}} opts
 * @returns {Array} placed items get `{ ...item, lane }`; crowded runs collapse
 *   into `{ x, lane, more: [item, ...] }` clusters. One flat array, x order.
 */
export function assignLanes(items, { width = 128, lanes = 4, chip = 56 } = {}) {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const ends = new Array(lanes).fill(-Infinity); // right edge currently occupied per lane
  const out = [];
  let cluster = null; // { x, lane, more }

  for (const item of sorted) {
    const left = item.x - width / 2;
    const right = item.x + width / 2;

    if (cluster && item.x - cluster.x < width) {
      cluster.more.push(item);
      continue;
    }
    if (cluster) cluster = null;

    const lane = ends.findIndex((end) => end <= left);
    if (lane !== -1) {
      ends[lane] = right;
      out.push({ ...item, lane });
      continue;
    }

    // No lane free — start a cluster in whichever lane frees up earliest,
    // positioned so its own chip doesn't overlap that lane's last card.
    const earliest = ends.indexOf(Math.min(...ends));
    const x = Math.max(item.x, ends[earliest] + chip / 2);
    ends[earliest] = x + chip / 2;
    cluster = { x, lane: earliest, more: [item] };
    out.push(cluster);
  }

  return out;
}
