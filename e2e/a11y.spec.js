import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// PRD §8: "WCAG 2.1 AA". Scope axe to exactly that ruleset — no best-practice
// extras the specs never asked for. One test per storyboard screen (1-7).
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

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

test('Screen 1 landing', async ({ page }) => {
  await scan(page);
});

test('Screen 2 explore', async ({ page }) => {
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  await expect(page.locator('#explore')).toBeVisible();
  await scan(page);
});

test('Screen 3 about', async ({ page }) => {
  await page.locator('.footer-links a', { hasText: 'About this project' }).click();
  await expect(page.locator('#about')).toBeVisible();
  await scan(page);
});

test('Screen 4 event detail', async ({ page }) => {
  await page.goto('./#event=qin');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  await expect(page.locator('#panel')).toHaveClass(/open/);
  await scan(page);
});

test('Screen 5 grand tour', async ({ page }) => {
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  await expect(page.locator('.tour')).toHaveClass(/open/);
  await scan(page);
});

test('Wuxia Tour + fiction detail', async ({ page }) => {
  await page.locator('.hero .actions .btn.ink', { hasText: 'Wuxia Tour' }).click();
  await expect(page.locator('.tour')).toHaveClass(/open/);
  await scan(page);
  await page.goto('./#event=chen-zhen-fist-of-fury');
  await expect(page.locator('#panel')).toHaveClass(/open/);
  await scan(page);
});

test('Screen 6 search results', async ({ page }) => {
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
  await page.locator('#q').fill('paper');
  await expect(page.locator('.search-results')).toBeVisible();
  await scan(page);
});

test.describe('Screen 7 explore mobile 360px', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('mobile explore', async ({ page }) => {
    await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
    await expect(page.locator('#explore')).toBeVisible();
    await scan(page);
  });
});
