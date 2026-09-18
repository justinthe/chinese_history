import { describe, it, expect, vi } from 'vitest';
import { trap } from '../src/lib/focus-trap.js';

function fakeEl() {
  return { focus: vi.fn() };
}

function fakeContainer(nodes) {
  return { querySelectorAll: () => nodes };
}

function fakeDoc(active) {
  const listeners = {};
  return {
    activeElement: active,
    addEventListener: (type, fn) => { listeners[type] = fn; },
    removeEventListener: vi.fn(),
    fire(e) { listeners.keydown(e); },
  };
}

describe('focus-trap', () => {
  it('Tab from the last element wraps to the first', () => {
    const [a, b, c] = [fakeEl(), fakeEl(), fakeEl()];
    const doc = fakeDoc(c);
    trap(fakeContainer([a, b, c]), doc);
    const e = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    doc.fire(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(a.focus).toHaveBeenCalled();
  });

  it('Shift+Tab from the first element wraps to the last', () => {
    const [a, b, c] = [fakeEl(), fakeEl(), fakeEl()];
    const doc = fakeDoc(a);
    trap(fakeContainer([a, b, c]), doc);
    const e = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
    doc.fire(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(c.focus).toHaveBeenCalled();
  });

  it('Tab in the middle is left alone', () => {
    const [a, b, c] = [fakeEl(), fakeEl(), fakeEl()];
    const doc = fakeDoc(b);
    trap(fakeContainer([a, b, c]), doc);
    const e = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    doc.fire(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(a.focus).not.toHaveBeenCalled();
    expect(c.focus).not.toHaveBeenCalled();
  });

  it('ignores non-Tab keys', () => {
    const doc = fakeDoc(fakeEl());
    trap(fakeContainer([fakeEl()]), doc);
    const e = { key: 'Escape', preventDefault: vi.fn() };
    doc.fire(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('is a no-op with no focusable elements', () => {
    const doc = fakeDoc(null);
    trap(fakeContainer([]), doc);
    const e = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
    expect(() => doc.fire(e)).not.toThrow();
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('cleanup removes the listener', () => {
    const doc = fakeDoc(fakeEl());
    const release = trap(fakeContainer([]), doc);
    release();
    expect(doc.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
