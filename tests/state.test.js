import { describe, it, expect, vi } from 'vitest';

function mockStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
}

/** Fresh module instance per test — state.js reads localStorage at module-eval time. */
async function freshState(localStorageInitial) {
  vi.resetModules();
  globalThis.localStorage = mockStorage(localStorageInitial);
  return import('../src/state.js');
}

describe('state: URL hash', () => {
  it('round-trips screen/year/event/cats through toHash -> fromHash', async () => {
    const { get, set, fromHash, toHash } = await freshState();
    set({ screen: 'explore', year: 690, eventId: 'wuzetian', cats: new Set(['war', 'tech']) });
    const hash = toHash(get());
    set(fromHash(hash));
    expect(get().screen).toBe('explore');
    expect(get().year).toBe(690);
    expect(get().eventId).toBe('wuzetian');
    expect([...get().cats].sort()).toEqual(['tech', 'war']);
  });

  it('omits cats from the hash when every category is on (default)', async () => {
    const { get, toHash } = await freshState();
    expect(toHash(get())).not.toMatch(/cats=/);
  });

  it('fromHash ignores an unknown screen', async () => {
    const { fromHash } = await freshState();
    expect(fromHash('#screen=bogus&year=1').screen).toBeUndefined();
  });

  it('fromHash clamps an out-of-range year', async () => {
    const { fromHash, YEAR_MAX, YEAR_MIN } = await freshState();
    expect(fromHash('#year=999999').year).toBe(YEAR_MAX);
    expect(fromHash('#year=-999999').year).toBe(YEAR_MIN);
  });

  it('fromHash drops cats when every value is unknown', async () => {
    const { fromHash } = await freshState();
    expect(fromHash('#cats=zzz,yyy').cats).toBeUndefined();
  });

  it('fromHash keeps only recognised categories out of a mixed list', async () => {
    const { fromHash } = await freshState();
    expect([...fromHash('#cats=war,bogus,tech').cats].sort()).toEqual(['tech', 'war']);
  });

  it('an event= with no screen= implies the explore screen', async () => {
    const { fromHash } = await freshState();
    expect(fromHash('#event=wuzetian').screen).toBe('explore');
  });
});

describe('state: localStorage (parsed defensively)', () => {
  it('garbage cats value falls back to all 7 default categories (fiction on by default)', async () => {
    const { get } = await freshState({ cats: 'zzz,yyy,not-real' });
    expect(get().cats.size).toBe(7);
    expect(get().cats.has('fiction')).toBe(true);
  });

  it('a valid stored cats list is respected on boot', async () => {
    const { get } = await freshState({ cats: 'war,tech' });
    expect([...get().cats].sort()).toEqual(['tech', 'war']);
  });

  it('set() never throws even if storage.setItem throws (private mode / quota)', async () => {
    const { set } = await freshState();
    globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(() => set({ tourIdx: 3, cats: new Set(['war']) })).not.toThrow();
  });
});
