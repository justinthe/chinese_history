import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CATS } from '../src/data.js';
import { contrastRatio, textOn } from '../src/dom.js';

// PRD §8: "Contrast ≥ 4.5:1 body". Category/era colors are always paired with
// textOn()'s pick as the text color (search.js chips, timeline.js bands,
// detail.js badges) — so the real requirement is "textOn's pick clears 4.5:1".
const ERAS = JSON.parse(readFileSync(fileURLToPath(new URL('../content/eras.json', import.meta.url))));

describe('contrastRatio', () => {
  it('matches known WCAG reference pairs', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
  });
});

describe('textOn picks a color that clears 4.5:1', () => {
  it('for every category color', () => {
    for (const [key, c] of Object.entries(CATS)) {
      const ratio = contrastRatio(textOn(c.color), c.color);
      expect(ratio, `${key} (${c.color}) only reaches ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('for every era band color', () => {
    for (const e of ERAS) {
      const ratio = contrastRatio(textOn(e.color), e.color);
      expect(ratio, `${e.id} (${e.color}) only reaches ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
