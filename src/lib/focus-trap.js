// PRD §8 "Focus trapped in detail panel." Pure-ish: doc is injected so this
// is node-testable without jsdom (same precedent as lib/tween.js's
// now/raf/cancel injection).
const FOCUSABLE =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/** Traps Tab/Shift+Tab inside container. Returns a cleanup that releases it. */
export function trap(container, doc = document) {
  function onKey(e) {
    if (e.key !== 'Tab') return;
    const f = [...container.querySelectorAll(FOCUSABLE)];
    if (!f.length) return;
    const i = f.indexOf(doc.activeElement);
    const next = e.shiftKey ? i - 1 : i + 1;
    if (next < 0 || next >= f.length) {
      e.preventDefault();
      f[(next + f.length) % f.length].focus();
    }
  }
  doc.addEventListener('keydown', onKey);
  return () => doc.removeEventListener('keydown', onKey);
}
