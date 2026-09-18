import { test, expect } from '@playwright/test';

test('landing page loads with title and no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // leading slash would resolve against the origin root, dropping the
  // /chinese_history/ base path baseURL carries
  await page.goto('./');

  await expect(page).toHaveTitle('Middle Kingdom Explorer');
  // Phase 02: the real landing hero is "Middle Kingdom<br><span>Explorer</span>",
  // not the placeholder h1 phase 01 shipped.
  await expect(page.locator('h1')).toContainText('Middle Kingdom');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  expect(errors).toEqual([]);
});
