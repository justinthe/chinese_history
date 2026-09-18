import { test, expect } from '@playwright/test';

// Storyboard Journey 1 and Journey 2, driven by page.keyboard only — no
// .click() anywhere in this file. PRD §8: "Keyboard: arrow keys move
// playhead, Tab reaches cards and pins, Enter opens, Esc closes."

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

/** Presses Tab until the focused element satisfies `matches` (page.evaluate predicate). */
async function tabUntil(page, matches, max = 150) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate(matches)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`tabUntil: no match within ${max} tabs`);
}

test('journey 1: explore, open event, follow related, Esc closes and returns focus', async ({ page }) => {
  await tabUntil(page, () => document.activeElement?.tagName === 'BUTTON' && document.activeElement.textContent.includes('Explore freely'));
  await page.keyboard.press('Enter');
  await expect(page.locator('#explore')).toBeVisible();

  // First directly-rendered card, not a named one — same reasoning as
  // e2e/detail.spec.js's generic focus-trap test: which event it is doesn't
  // matter, only that Tab reaches it and Enter opens it (PRD §8).
  await tabUntil(page, () => document.activeElement?.classList.contains('ev'));
  // `.ev b` may carry a nested `.legend-tag` span for legendary events (timeline.js) —
  // strip it so this matches the plain title detail.js's h2 renders.
  const openedTitle = await page.evaluate(() => {
    const b = document.activeElement.querySelector('b').cloneNode(true);
    b.querySelectorAll('.legend-tag').forEach((n) => n.remove());
    return b.textContent;
  });
  await page.keyboard.press('Enter');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator('h2')).toHaveText(openedTitle);

  await tabUntil(page, () => document.activeElement?.closest('.related') != null);
  // Related button text is `${icon} ${title}` (detail.js) — strip the leading icon "word".
  const relatedTitle = await page.evaluate(() => document.activeElement.textContent.replace(/^\S+\s/, '').trim());
  await page.keyboard.press('Enter');
  await expect(panel.locator('h2')).toHaveText(relatedTitle);

  await page.keyboard.press('Escape');
  await expect(panel).not.toHaveClass(/open/);
  await expect(page.locator('#explore')).toBeVisible();
});

test('journey 2: grand tour to completion via arrow keys', async ({ page }) => {
  await tabUntil(page, () => document.activeElement?.tagName === 'BUTTON' && document.activeElement.textContent.includes('Take the Grand Tour'));
  await page.keyboard.press('Enter');
  const tour = page.locator('.tour');
  await expect(tour).toHaveClass(/open/);
  await expect(tour.locator('h3')).toContainText('Stop 1 of 20');

  // tour.js focuses the panel itself on open and its own keydown handler
  // reads ArrowRight/ArrowLeft while focus is inside it (src/views/tour.js) —
  // no Tab needed to reach a "Next" button.
  for (let i = 0; i < 19; i++) await page.keyboard.press('ArrowRight');
  await expect(tour.locator('h3')).toContainText('Stop 20 of 20');

  await page.keyboard.press('ArrowRight'); // 20th press: past the last stop -> end(true)
  await expect(page.locator('.toast')).toContainText('Tour complete');
  await expect(tour).not.toHaveClass(/open/);
});
