// Tiny DOM helpers shared by every view. No framework — architecture.md §2
// picked vanilla JS; this is the whole "helper layer" it needs.

/** Create an element, optionally with a class and textContent (never innerHTML). */
export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function qs(sel, root = globalThis.document) {
  return root?.querySelector(sel);
}

/** Picks dark or light text for a hex background (WCAG-ish luminance threshold). */
export function textOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#2b2118' : '#fff';
}

let toastTimer;
/** Shows the toast strip for 2.5s (matches mockup.html's toast()). */
export function toast(msg) {
  const t = qs('#toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = 'none'; }, 2500);
}
