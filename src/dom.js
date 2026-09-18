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

/** Real sRGB-linearized WCAG relative luminance (not a raw-channel approximation). */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors (PRD §8: ≥4.5:1 body / ≥3:1 large). */
export function contrastRatio(hexA, hexB) {
  const [l1, l2] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Picks whichever of ink/white gives higher real contrast against a hex background. */
export function textOn(hex) {
  return contrastRatio('#2b2118', hex) >= contrastRatio('#ffffff', hex) ? '#2b2118' : '#ffffff';
}

/** True when the user's OS/browser asked for reduced motion (map morph, timeline scroll). */
export function reduceMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

let toastTimer;
/** Shows the toast strip for 2.5s; #toast is role="status" in index.html so this announces to AT. */
export function toast(msg) {
  const t = qs('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); }, 2500);
}
