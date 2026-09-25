import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resumeIdx } from '../src/views/tour.js';

const CONTENT_DIR = fileURLToPath(new URL('../content/', import.meta.url));
const fsRead = (file) => JSON.parse(readFileSync(`${CONTENT_DIR}${file}`, 'utf8'));

function mockStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
}

/** Fresh module graph per test — state.js/tour.js are stateful singletons
 *  (same pattern as tests/state.test.js's freshState). */
async function freshTour(localStorageInitial) {
  vi.resetModules();
  globalThis.localStorage = mockStorage(localStorageInitial);
  const data = await import('../src/data.js');
  await data.load(fsRead);
  const state = await import('../src/state.js');
  const tour = await import('../src/views/tour.js');
  return { data, state, tour };
}

describe('tour.js: resumeIdx (pure)', () => {
  it('clamps out-of-range or non-integer stored values to 0', () => {
    expect(resumeIdx(NaN, 10)).toBe(0);
    expect(resumeIdx(-1, 10)).toBe(0);
    expect(resumeIdx(99, 10)).toBe(0);
    expect(resumeIdx(10, 10)).toBe(0); // equal to len is out of range
  });

  it('keeps an in-range stored value', () => {
    expect(resumeIdx(3, 10)).toBe(3);
    expect(resumeIdx(0, 10)).toBe(0);
  });
});

describe('tour.js: start()', () => {
  it('starts at stop 0 with no stored tourStop', async () => {
    const { data, state, tour } = await freshTour();
    tour.start();
    const ev = data.EVENTS.find((e) => e.id === data.TOURS.grand[0].event);
    expect(state.get().tourIdx).toBe(0);
    expect(state.get().year).toBe(ev.year);
  });

  it('resumes at a valid stored stop (reload mid-tour)', async () => {
    const { data, state, tour } = await freshTour({ tourStop: '3' });
    tour.start();
    const ev = data.EVENTS.find((e) => e.id === data.TOURS.grand[3].event);
    expect(state.get().tourIdx).toBe(3);
    expect(state.get().year).toBe(ev.year);
  });

  it('falls back to stop 0 for an out-of-range stored stop', async () => {
    const { state, tour } = await freshTour({ tourStop: '999' });
    tour.start();
    expect(state.get().tourIdx).toBe(0);
  });
});

describe('tour.js: step()', () => {
  it('does not go below stop 0', async () => {
    const { state, tour } = await freshTour();
    tour.start();
    tour.step(-1);
    expect(state.get().tourIdx).toBe(0);
  });

  it('stepping past the last stop finishes the tour (tourIdx -> -1)', async () => {
    const { data, state, tour } = await freshTour();
    const last = data.TOURS.grand.length - 1;
    state.set({ tourIdx: last, year: 0, eventId: null });
    tour.step(1);
    expect(state.get().tourIdx).toBe(-1);
  });
});

describe('tour.js: end() — exit clears', () => {
  it('sets tourIdx to -1 and persists a value resumeIdx maps back to 0', async () => {
    const { data, state, tour } = await freshTour();
    tour.start();
    tour.end(false);
    expect(state.get().tourIdx).toBe(-1);
    const stored = parseInt(globalThis.localStorage.getItem('tourStop'), 10);
    expect(resumeIdx(stored, data.TOURS.grand.length)).toBe(0);
  });

  it('reload after exit starts a fresh Grand Tour at stop 0, not the exited stop', async () => {
    const { tour: tour1 } = await freshTour();
    tour1.start();
    tour1.step(1); // stop 1
    tour1.end(false);
    const storedRaw = globalThis.localStorage.getItem('tourStop');

    const { state: state2, tour: tour2 } = await freshTour({ tourStop: storedRaw });
    tour2.start();
    expect(state2.get().tourIdx).toBe(0);
  });
});

describe('tour.js: Wuxia Tour', () => {
  it('starts at its own first stop and keeps its own resume key', async () => {
    const { data, state, tour } = await freshTour({ tourStop: '3' }); // grand progress must not leak in
    tour.start('wuxia');
    const ev = data.EVENTS.find((e) => e.id === data.TOURS.wuxia[0].event);
    expect(state.get().tourId).toBe('wuxia');
    expect(state.get().tourIdx).toBe(0);
    expect(state.get().year).toBe(ev.year);
    tour.step(1);
    expect(globalThis.localStorage.getItem('tourStop:wuxia')).toBe('1');
    expect(globalThis.localStorage.getItem('tourStop')).toBe('3');
  });

  it('switching tours mid-way resumes each at its own stop', async () => {
    const { state, tour } = await freshTour({ tourStop: '2', 'tourStop:wuxia': '4' });
    tour.start('wuxia');
    expect(state.get().tourIdx).toBe(4);
    tour.start('grand');
    expect(state.get().tourId).toBe('grand');
    expect(state.get().tourIdx).toBe(2);
  });

  it('every wuxia stop is a fiction or martial-legend card', async () => {
    const { data } = await freshTour();
    expect(data.TOURS.wuxia.length).toBeGreaterThanOrEqual(15);
    data.TOURS.wuxia.forEach((stop) => {
      const ev = data.EVENTS.find((e) => e.id === stop.event);
      expect(['fiction', 'people'], stop.event).toContain(ev.category);
    });
  });
});
