import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

describe('container init', () => {
  it('index.html carries the CSP meta tag', () => {
    expect(html).toMatch(/<meta http-equiv="Content-Security-Policy"/);
  });

  it('loads no external font origins', () => {
    expect(html).not.toMatch(/googleapis|gstatic/);
    expect(css).not.toMatch(/googleapis|gstatic/);
  });

  it('defines the paper background token', () => {
    expect(css).toMatch(/--paper:\s*#fff7e8/);
  });
});
