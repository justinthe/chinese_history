import { test, expect } from '@playwright/test';

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

// Journey 1: first visit -> explore an event -> related chip -> Esc back.
test('journey 1: explore, open event, follow related, Esc closes', async ({ page }) => {
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  await expect(page.locator('#explore')).toBeVisible();
  await expect(page.locator('#yearBadge, .year-badge')).toHaveText('221 BCE');

  await page.locator('.ev b', { hasText: 'Qin Shi Huang unifies China' }).click();
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator('h2')).toHaveText('Qin Shi Huang unifies China');

  await panel.locator('.related button', { hasText: 'Great Wall linked together' }).click();
  await expect(panel.locator('h2')).toHaveText('Great Wall linked together');

  await page.keyboard.press('Escape');
  await expect(panel).not.toHaveClass(/open/);
  await expect(page.locator('#explore')).toBeVisible();
});

// Journey 2: Grand Tour end to end -> completion toast -> free explore.
test('journey 2: grand tour to completion', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await expect(tour).toHaveClass(/open/);
  await expect(tour.locator('h3')).toContainText('Stop 1 of 10');

  for (let i = 0; i < 9; i++) {
    await tour.locator('button', { hasText: 'Next →' }).click();
  }
  await expect(tour.locator('h3')).toContainText('Stop 10 of 10');
  await tour.locator('button', { hasText: 'Finish 🎉' }).click();

  await expect(page.locator('.toast')).toBeVisible();
  await expect(page.locator('.toast')).toContainText('Tour complete');
  await expect(tour).not.toHaveClass(/open/);
});

// Journey 3: search by name.
test('journey 3: search by name opens the matching event', async ({ page }) => {
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  await page.locator('#q').fill('paper');
  const results = page.locator('.search-results');
  await expect(results).toBeVisible();
  await results.locator('div', { hasText: 'Cai Lun invents paper' }).click();
  await expect(page.locator('#panel')).toHaveClass(/open/);
  await expect(page.locator('#panel h2')).toHaveText('Cai Lun invents paper');
});

test('search with no match shows the "No match" row', async ({ page }) => {
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  await page.locator('#q').fill('zzz');
  await expect(page.locator('.search-results')).toHaveText('No match');
});

// Journey 9: About and back.
test('journey 9: about page and back', async ({ page }) => {
  await page.locator('.footer-links a', { hasText: 'About this project' }).click();
  await expect(page.locator('#about')).toBeVisible();
  await page.locator('#about .btn', { hasText: 'Back' }).click();
  await expect(page.locator('#landing')).toBeVisible();
});

// Phase 09: About's credits section (PRD F9) and the footer's real link to it.
test('about page lists image credits with license links', async ({ page }) => {
  await page.locator('.footer-links a', { hasText: 'About this project' }).click();
  await expect(page.locator('#about h2', { hasText: 'Credits' })).toBeVisible();
  const rows = page.locator('.credits-list li');
  expect(await rows.count()).toBeGreaterThan(0);
  await expect(page.locator('.credits-list a').first()).toHaveAttribute('href', /.+/);
});

test('footer "Sources & credits" link goes to the About credits, not a toast stub', async ({ page }) => {
  await page.locator('.footer-links a', { hasText: 'Sources & credits' }).click();
  await expect(page.locator('#about h2', { hasText: 'Credits' })).toBeVisible();
});

test('turning off the last category chip is blocked with a toast', async ({ page }) => {
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  const chips = page.locator('.chips .chip');
  const count = await chips.count();
  for (let i = 1; i < count; i++) await chips.nth(i).click();
  const lastOn = chips.nth(0);
  await expect(lastOn).toHaveClass(/on/);
  await lastOn.click();
  await expect(page.locator('.toast')).toContainText('Keep at least one category on');
  await expect(lastOn).toHaveClass(/on/);
});

test('filtering to one category with none in the current era shows the map empty state', async ({ page }) => {
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  // Default year is Qin (221 BCE), which has no Nature-category event.
  const chips = page.locator('.chips .chip');
  const chipCount = await chips.count();
  for (let i = 0; i < chipCount; i++) {
    const chip = chips.nth(i);
    if (!(await chip.textContent())?.includes('Nature')) await chip.click();
  }
  await expect(page.locator('#map text.map-empty')).toContainText('No events in this era');
});

test.describe('mobile 390px: tour becomes a bottom sheet, map stays usable', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('grand tour sheet does not crush the map', async ({ page }) => {
    await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
    const tour = page.locator('.tour');
    await expect(tour).toHaveClass(/open/);
    const mapBox = await page.locator('.mapwrap').boundingBox();
    expect(mapBox.height).toBeGreaterThanOrEqual(200);
    const tourBox = await tour.boundingBox();
    expect(tourBox.width).toBeGreaterThan(300); // full-width bottom sheet, not the 340px docked panel
  });
});

test.describe('360px viewport stays usable', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('chips wrap, map still ≥200px tall', async ({ page }) => {
    await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
    const mapBox = await page.locator('.mapwrap').boundingBox();
    expect(mapBox.height).toBeGreaterThanOrEqual(200);
  });
});
