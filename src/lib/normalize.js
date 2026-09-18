// Pure, node-safe text helpers for search — no DOM, unit-tested directly
// (same precedent as lib/lanes.js and lib/tween.js).

/** Case- and diacritic-insensitive fold: "Qín" and "qin" compare equal. */
export function fold(s) {
  return s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
}

/**
 * Parses a year with optional BCE/CE suffix (any case, "BC"/"AD" accepted too).
 * "221 BCE" -> -221, "105 CE" / "105" -> 105, "-221" -> -221. Returns null for
 * anything that isn't a plain year.
 */
export function parseYear(s) {
  const m = s.trim().match(/^(-?\d+)\s*(bce|bc|ce|ad)?$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const suffix = (m[2] || '').toLowerCase();
  if (suffix === 'bce' || suffix === 'bc') return -Math.abs(n);
  return n;
}
