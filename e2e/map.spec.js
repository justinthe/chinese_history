import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const SHAPES = JSON.parse(readFileSync(new URL('../content/map-shapes.json', import.meta.url), 'utf8'));

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

test('scrubbing from Qin to Han morphs the territory polygon', async ({ page }) => {
  const territory = page.locator('#territory');
  const before = await territory.getAttribute('points');

  await page.locator('.band[title^="Han"]').click();
  await expect.poll(() => territory.getAttribute('points')).not.toBe(before);

  // Give the 600ms morph time to settle on Han's exact final shape.
  await expect.poll(async () => territory.getAttribute('points'), { timeout: 2000 }).toBe(SHAPES.han.join(' '));
});

test('reduced motion: era change swaps the shape instantly, no in-between frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const territory = page.locator('#territory');

  await page.locator('.band[title^="Han"]').click();
  await expect(territory).toHaveAttribute('points', SHAPES.han.join(' '));
});

test('clicking a pin opens the detail panel', async ({ page }) => {
  await page.locator('.pin').first().click();
  await expect(page.locator('#panel')).toHaveClass(/open/);
});

test('pins are keyboard-focusable and Enter opens the detail panel', async ({ page }) => {
  const pin = page.locator('.pin').first();
  await expect(pin).toHaveAttribute('tabindex', '0');
  await expect(pin).toHaveAttribute('role', 'button');
  await expect(pin).toHaveAttribute('aria-label', /.+/);
  await pin.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel')).toHaveClass(/open/);
});

test('filtering to Nature at Qin shows the map empty state', async ({ page }) => {
  const chips = page.locator('.chips .chip');
  const chipCount = await chips.count();
  for (let i = 0; i < chipCount; i++) {
    const chip = chips.nth(i);
    if (!(await chip.textContent())?.includes('Nature')) await chip.click();
  }
  await expect(page.locator('#map text.map-empty')).toContainText('No events in this era');
});

test('era card shows the Legendary badge for Xia', async ({ page }) => {
  await page.locator('.band[title^="Xia"]').click();
  await expect(page.locator('.era-label p').first()).toContainText('Legendary');
});

test('map +/- zoom scales the viewBox and clamps at 2x', async ({ page }) => {
  const map = page.locator('#map');
  const vb0 = await map.getAttribute('viewBox');
  expect(vb0).toBe('0 0 600 500');

  const zoomIn = page.locator('.map-controls button', { hasText: '＋' });
  const zoomOut = page.locator('.map-controls button', { hasText: '－' });

  await zoomIn.click();
  const vb1 = await map.getAttribute('viewBox');
  expect(vb1).not.toBe(vb0);
  const w1 = Number(vb1.split(' ')[2]);
  expect(w1).toBeLessThan(600);

  // Click well past the 2x ceiling; viewBox width must clamp, not keep shrinking.
  await zoomIn.click();
  await zoomIn.click();
  await zoomIn.click();
  const vbMax = await map.getAttribute('viewBox');
  expect(Number(vbMax.split(' ')[2])).toBe(300); // 600 / 2x ceiling

  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  const vbMin = await map.getAttribute('viewBox');
  expect(vbMin).toBe('0 0 600 500'); // clamps at 1x, doesn't zoom out further
});
