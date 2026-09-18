import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.errors = errors;
});

test.afterEach(async ({ page }) => {
  expect(page.errors, page.errors.join('\n')).toEqual([]);
});

// tasks/lessons.md L4: write the closed-state assertion before the open one.
test('closed panel is not in the tab order', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).not.toHaveClass(/open/);
  await expect(panel).toHaveJSProperty('inert', true);
});

test('click a card opens the panel; Tab never leaves it; Esc closes and returns focus to the card', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  await expect(page.locator('#explore')).toBeVisible();

  // This test's purpose is generic focus-trap/focus-return behavior, not any
  // specific event — use the first directly-rendered card rather than a named
  // one. (Phase 10's content fill made several eras, including Qin, dense
  // enough to cluster into "+N" popovers; a card inside a closed popover
  // becomes unfocusable, which would make the focus-return assertion below
  // fail for reasons unrelated to what this test actually checks.)
  const card = page.locator('.ev').first();
  await card.locator('b').click();
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const inPanel = await page.evaluate(() => document.getElementById('panel').contains(document.activeElement));
    expect(inPanel).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(panel).not.toHaveClass(/open/);
  await expect(card).toBeFocused();
});

test('event with a manifest entry shows the image and its credit/license line', async ({ page }) => {
  // 'terracotta' is still CC BY-SA 3.0 (unchanged since phase 09); 'qin' now
  // carries a real fetched Public-domain photo instead of the phase-06 SVG
  // placeholder this test originally targeted.
  await page.goto('./#event=terracotta');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator('.art img')).toHaveAttribute('alt', /.+/);
  await expect(panel.locator('.credit')).toContainText('CC BY-SA');
});

test('event without a manifest entry shows its category icon, no broken image', async ({ page }) => {
  // 'gunpowder' has no Commons/Met source with an allowlisted license (phase-10
  // content fill searched it repeatedly and found none) — a stable imageless
  // fixture, unlike 'wall', which phase 10 gave a real image to.
  await page.goto('./#event=gunpowder');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator('.art img')).toHaveCount(0);
  await expect(panel.locator('.art svg')).toBeVisible();
});

test('prev/next step chronologically within category, disabled at the ends', async ({ page }) => {
  // Phase 10 added many more 'people' events, so the first-in-category id
  // shifted — assert the boundary behavior, not a hardcoded pair
  // (tests/detail-render.test.js's unit test covers the same lesson).
  await page.goto('./#event=confucius');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);

  const prev = panel.locator('.nav-row button', { hasText: 'Prev' });
  const next = panel.locator('.nav-row button', { hasText: 'Next' });
  await expect(prev).toBeEnabled();
  await expect(next).toBeEnabled();

  // Click Prev repeatedly until it disables — proves the chain terminates
  // at a real first-in-category event without assuming which one.
  for (let i = 0; i < 40 && await prev.isEnabled(); i++) await prev.click();
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  // Same from the other end via Next.
  for (let i = 0; i < 40 && await next.isEnabled(); i++) await next.click();
  await expect(next).toBeDisabled();
  await expect(prev).toBeEnabled();
});

test.describe('mobile 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('panel is a bottom sheet', async ({ page }) => {
    await page.goto('./#event=qin');
    await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
    const panel = page.locator('#panel');
    await expect(panel).toHaveClass(/open/);
    const box = await panel.boundingBox();
    expect(box.width).toBeGreaterThan(350); // full-width, not the 460px desktop slide-in
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(840); // flush to viewport bottom
  });
});
