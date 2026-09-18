import { describe, it, expect } from 'vitest';
import { nextCats } from '../src/views/search.js';

describe('search.js: nextCats', () => {
  it('turns a cat on', () => {
    const cats = new Set(['dynasty']);
    expect(nextCats(cats, 'war')).toEqual(new Set(['dynasty', 'war']));
  });

  it('turns a cat off when more than one remains', () => {
    const cats = new Set(['dynasty', 'war']);
    expect(nextCats(cats, 'war')).toEqual(new Set(['dynasty']));
  });

  it('returns null instead of turning off the last remaining cat', () => {
    const cats = new Set(['dynasty']);
    expect(nextCats(cats, 'dynasty')).toBeNull();
  });

  it('never mutates the input set', () => {
    const cats = new Set(['dynasty', 'war']);
    nextCats(cats, 'war');
    expect(cats).toEqual(new Set(['dynasty', 'war']));
  });
});
