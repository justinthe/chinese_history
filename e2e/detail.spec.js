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

  const card = page.locator('.ev', { hasText: 'Qin Shi Huang unifies China' });
  // Click the inner <b> (house pattern, shell.spec.js journey 1) — the
  // playhead slider overlaps part of the button's own bounding box.
  await page.locator('.ev b', { hasText: 'Qin Shi Huang unifies China' }).click();
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
  await page.goto('./#event=qin');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator('.art img')).toHaveAttribute('alt', /.+/);
  await expect(panel.locator('.credit')).toContainText('CC BY-SA');
});

test('event without a manifest entry shows its category icon, no broken image', async ({ page }) => {
  await page.goto('./#event=wall');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator('.art img')).toHaveCount(0);
  await expect(panel.locator('.art svg')).toBeVisible();
});

test('prev/next step chronologically within category, disabled at the ends', async ({ page }) => {
  await page.goto('./#event=confucius');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);

  const prev = panel.locator('.nav-row button', { hasText: 'Prev' });
  const next = panel.locator('.nav-row button', { hasText: 'Next' });
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(panel.locator('h2')).toHaveText('Wu Zetian becomes emperor');
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
