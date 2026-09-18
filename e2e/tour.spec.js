import { test, expect } from '@playwright/test';

// Journey 2 to plain completion is already covered by shell.spec.js. This
// file covers the rest of PRD F5: per-stop map/timeline sync, Read more
// without losing tour state, reload-and-resume, Exit, and keyboard access.

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.errors = errors;
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
});

test.afterEach(async ({ page }) => {
  expect(page.errors, page.errors.join('\n')).toEqual([]);
});

test('Next changes year badge, map shape, timeline position, and glows the stop card', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await expect(tour).toHaveClass(/open/);

  const yearBadge = page.locator('#yearBadge, .year-badge');
  const yearBefore = await yearBadge.textContent();
  const pointsBefore = await page.locator('#territory').getAttribute('points');

  await tour.locator('button', { hasText: 'Next →' }).click();
  await expect(tour.locator('h3')).toContainText('Stop 2 of 20');

  await expect(yearBadge).not.toHaveText(yearBefore ?? '');
  // Territory morph is animated (lib/tween.js) — poll until it settles on a
  // different shape rather than asserting immediately after the click.
  await expect(async () => {
    const pointsAfter = await page.locator('#territory').getAttribute('points');
    expect(pointsAfter).not.toBe(pointsBefore);
  }).toPass();

  // The stop's event card carries .glow (timeline.js: highlightId from TOUR[tourIdx]).
  await expect(page.locator('.ev.glow')).toHaveCount(1);
});

test('Read more opens detail without losing tour state; closing returns to the same stop', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await expect(tour).toHaveClass(/open/);
  const stopText = await tour.locator('h3').textContent();

  await tour.locator('button.link', { hasText: 'Read more' }).click();
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(tour).toHaveClass(/open/); // tour panel stays mounted behind detail

  await page.keyboard.press('Escape');
  await expect(panel).not.toHaveClass(/open/);
  await expect(tour).toHaveClass(/open/);
  await expect(tour.locator('h3')).toHaveText(stopText ?? '');
});

test('reload mid-tour: Grand Tour button resumes at that stop', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await tour.locator('button', { hasText: 'Next →' }).click();
  await tour.locator('button', { hasText: 'Next →' }).click();
  await expect(tour.locator('h3')).toContainText('Stop 3 of 20');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  await expect(tour).not.toHaveClass(/open/); // resume happens on button press, not on load

  await page.locator('.topbar .btn.gold', { hasText: 'Grand Tour' }).click();
  await expect(tour).toHaveClass(/open/);
  await expect(tour.locator('h3')).toContainText('Stop 3 of 20');
});

test('Finish → toast, panel closes, free explore at last stop\'s year', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  for (let i = 0; i < 19; i++) await tour.locator('button', { hasText: 'Next →' }).click();
  await expect(tour.locator('h3')).toContainText('Stop 20 of 20');
  const lastYear = await page.locator('#yearBadge, .year-badge').textContent();

  await tour.locator('button', { hasText: 'Finish 🎉' }).click();
  await expect(page.locator('.toast')).toContainText('Tour complete');
  await expect(tour).not.toHaveClass(/open/);
  await expect(page.locator('#yearBadge, .year-badge')).toHaveText(lastYear ?? '');
});

test('Exit tour: panel closes, next Grand Tour starts fresh at stop 1', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await tour.locator('button', { hasText: 'Next →' }).click();
  await tour.locator('button.link', { hasText: 'Exit tour' }).click();
  await expect(tour).not.toHaveClass(/open/);
  await expect(page.locator('#explore')).toBeVisible();

  await page.locator('.topbar .btn.gold', { hasText: 'Grand Tour' }).click();
  await expect(tour).toHaveClass(/open/);
  await expect(tour.locator('h3')).toContainText('Stop 1 of 20');
});

test('ArrowRight/ArrowLeft step the tour while focused, without also shifting the year ±25', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await expect(tour).toBeFocused();

  await page.keyboard.press('ArrowRight');
  await expect(tour.locator('h3')).toContainText('Stop 2 of 20');
  const yearAfterRight = await page.locator('#yearBadge, .year-badge').textContent();

  await page.keyboard.press('ArrowLeft');
  await expect(tour.locator('h3')).toContainText('Stop 1 of 20');
  const yearAfterLeft = await page.locator('#yearBadge, .year-badge').textContent();

  // If timeline.js's document-level ±25y handler had also fired, these would
  // include a stray "+25"/"-25" on top of the stop's own year — regression
  // guard for the stopPropagation() in tour.js's keydown handler.
  expect(yearAfterRight).not.toBe(yearAfterLeft);
  await tour.locator('button', { hasText: 'Next →' }).click();
  await expect(page.locator('#yearBadge, .year-badge')).toHaveText(yearAfterRight ?? '');
});

test('Esc exits the tour when the panel has focus', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await expect(tour).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(tour).not.toHaveClass(/open/);
});

// PRD F5 / prompt line 14: "Esc exits (after closing detail if open)" — the
// full two-step sequence, not just each half in isolation.
test('Esc closes detail first, then a second Esc exits the tour', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  const panel = page.locator('#panel');
  await tour.locator('button.link', { hasText: 'Read more' }).click();
  await expect(panel).toHaveClass(/open/);

  await page.keyboard.press('Escape');
  await expect(panel).not.toHaveClass(/open/);
  await expect(tour).toHaveClass(/open/); // still mid-tour, not exited yet

  await page.keyboard.press('Escape');
  await expect(tour).not.toHaveClass(/open/);
});

test.describe('mobile 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Grand Tour bottom sheet, map still visible', async ({ page }) => {
    await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
    const tour = page.locator('.tour');
    await expect(tour).toHaveClass(/open/);
    const mapBox = await page.locator('.mapwrap').boundingBox();
    expect(mapBox.height).toBeGreaterThanOrEqual(200);
  });
});
