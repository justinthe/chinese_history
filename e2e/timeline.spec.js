import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.errors = errors;
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  await expect(page.locator('#explore')).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(page.errors, page.errors.join('\n')).toEqual([]);
});

function hashParams(page) {
  return new URL(page.url()).hash.slice(1);
}
function hashYear(page) {
  return Number(new URLSearchParams(hashParams(page)).get('year'));
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  // src/views/timeline.js's scrollToYear()/pan() previously always passed
  // behavior:'smooth' — the CSS-only `*{transition:none}` rule can't touch a
  // JS scrollTo() call, so this was the one animation prefers-reduced-motion
  // missed (tasks/todo.md). A smooth scroll takes several frames to settle;
  // an instant one has already arrived by the very next tick.
  test('a year jump scrolls instantly, not smoothly', async ({ page }) => {
    const scroller = page.locator('.tl-scroll');
    const band = page.locator('.band').nth(2); // an era away from the default view
    await band.click();
    const immediate = await scroller.evaluate((n) => n.scrollLeft);
    await page.waitForTimeout(80);
    const settled = await scroller.evaluate((n) => n.scrollLeft);
    expect(immediate).toBe(settled);
  });
});

test('mouse wheel over the timeline scrolls it sideways, page does not scroll', async ({ page }) => {
  const scroller = page.locator('.tl-scroll');
  const before = await scroller.evaluate((n) => n.scrollLeft);
  await scroller.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => scroller.evaluate((n) => n.scrollLeft)).not.toBe(before);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('drag pans without changing the year; a short click sets it', async ({ page }) => {
  const scroller = page.locator('.tl-scroll');
  const box = await scroller.boundingBox();
  const yearBefore = hashYear(page);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 150, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  expect(hashYear(page)).toBe(yearBefore); // drag must not set the year

  await page.mouse.click(box.x + 40, box.y + box.height - 10);
  await expect.poll(() => hashYear(page)).not.toBe(yearBefore); // a short click does
});

test('arrow keys move the playhead exactly 25 years', async ({ page }) => {
  const yearBefore = hashYear(page);
  await page.keyboard.press('ArrowRight');
  expect(hashYear(page)).toBe(yearBefore + 25);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  expect(hashYear(page)).toBe(yearBefore - 25);
});

test('buttons pan ~60% of a screen; minus at minimum shows the whole span', async ({ page }) => {
  const scroller = page.locator('.tl-scroll');
  const width = (await scroller.boundingBox()).width;
  const before = await scroller.evaluate((n) => n.scrollLeft);
  await page.locator('.tl-tools button', { hasText: '▶' }).click();
  // pan() scrolls smooth — poll until it settles past the expected threshold
  // instead of reading scrollLeft mid-animation.
  await expect.poll(() => scroller.evaluate((n) => n.scrollLeft), { timeout: 2000 }).toBeGreaterThan(before + width * 0.4);
  const after = await scroller.evaluate((n) => n.scrollLeft);
  expect(after - before).toBeLessThan(width * 0.8);

  for (let i = 0; i < 10; i++) await page.locator('.tl-tools button', { hasText: '－' }).click();
  const innerWidth = await page.locator('.tl-inner').evaluate((n) => parseFloat(n.style.width));
  expect(innerWidth).toBeLessThanOrEqual(width + 1);
});

test('at default zoom no two cards fully overlap; a crowded run shows a "+N" cluster that opens a list', async ({ page }) => {
  const boxes = await page.locator('.ev').evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    })
  );
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const fullyOverlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      expect(fullyOverlap).toBe(false);
    }
  }

  const more = page.locator('.ev-more').first();
  if (await more.count()) {
    // Regression guard: an unconditional `display` on `.more-list` would defeat
    // the popover's UA closed-state style and show every list at once.
    await expect(page.locator('.more-list:popover-open')).toHaveCount(0);
    for (const list of await page.locator('.more-list').all()) await expect(list).toBeHidden();

    await more.click();
    await expect(page.locator('.more-list:popover-open')).toBeVisible();
    await page.locator('.more-row').first().click();
    await expect(page.locator('#panel')).toHaveClass(/open/);
  }
});

test('Tab reaches a card, Enter opens it', async ({ page }) => {
  const card = page.locator('.ev').first();
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel')).toHaveClass(/open/);
});

test('era band under the playhead is outlined', async ({ page }) => {
  await expect(page.locator('.band.current')).toHaveCount(1);
});

test('150-event fixture renders and stays responsive to arrow-key scrolling', async ({ page }) => {
  const eras = await page.evaluate(async () => {
    const res = await fetch('./content/eras.json');
    return res.json();
  });
  const fixture = [];
  for (let i = 0; i < 150; i++) {
    const era = eras[i % eras.length];
    const end = era.end ?? new Date().getFullYear();
    const year = Math.floor(era.start + (i / eras.length) * (end - era.start));
    fixture.push({
      id: `synthetic-${i}`,
      title: `Synthetic event ${i}`,
      hanzi: '合成',
      pinyin: 'héchéng',
      year,
      era: era.id,
      category: ['dynasty', 'war', 'tech', 'nature', 'people', 'other'][i % 6],
      icon: '🔹',
      body: ['Synthetic fixture event for load testing.'],
      whyItMatters: 'Load-testing fixture.',
      xy: [300, 300],
      related: [],
    });
  }

  await page.route('**/content/events.json', (route) => route.fulfill({ json: fixture }));
  // beforeEach already navigated to explore, which is now in the URL hash —
  // reload lands back on explore directly, no "Explore freely" click needed.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  await expect(page.locator('#explore')).toBeVisible();
  await page.locator('.tl-tools button', { hasText: '－' }).click(); // zoom to fit-all so every card renders

  const cardCount = await page.locator('.ev').count();
  const clusterCount = await page.locator('.ev-more').count();
  expect(cardCount + clusterCount).toBeGreaterThan(0);

  const start = Date.now();
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
  expect(Date.now() - start).toBeLessThan(5000); // generous wall-clock budget; true fps is measured by hand
});
