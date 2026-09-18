import { describe, it, expect } from 'vitest';
import { defaultPxPerYear, clampPxPerYear, YEAR_MIN, YEAR_MAX } from '../src/state.js';

const SPAN = YEAR_MAX - YEAR_MIN; // 4280 years

describe('timeline zoom', () => {
  it('default zoom makes the timeline ~2.5 screens wide', () => {
    const viewW = 1400;
    const px = defaultPxPerYear(viewW);
    const totalWidth = px * SPAN;
    expect(totalWidth / viewW).toBeCloseTo(2.5, 1);
  });

  it('clamps to the fit-all floor — never narrower than the whole span', () => {
    const viewW = 1400;
    const floor = viewW / SPAN;
    expect(clampPxPerYear(0.0001, viewW)).toBeCloseTo(floor);
    expect(clampPxPerYear(floor / 2, viewW)).toBeCloseTo(floor);
  });

  it('clamps to a 4 px/year ceiling', () => {
    expect(clampPxPerYear(100, 1400)).toBe(4);
  });

  it('fit-all floor keeps the full 4,000+ year span on screen', () => {
    const viewW = 1400;
    const floor = clampPxPerYear(0, viewW);
    expect(floor * SPAN).toBeLessThanOrEqual(viewW + 0.001);
  });
});
