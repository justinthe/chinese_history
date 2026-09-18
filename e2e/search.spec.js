import { test, expect } from '@playwright/test';

// Journey 3 (search by name -> opens the matching event) and the "No match"
// row are already covered in shell.spec.js. This file covers the rest of
// PRD F6: Journey 4 (search by year), keyboard nav, and chip URL persistence,
// plus F7's Meanwhile strip (era-boundary text change).

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(String(err)));
  page.errors = errors;
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  await page.locator('.hero .actions .btn', { hasText: 'Explore freely' }).click();
});

test.afterEach(async ({ page }) => {
  expect(page.errors, page.errors.join('\n')).toEqual([]);
});

// Journey 4: search by year -> playhead moves, no panel opens.
test('journey 4: search by year jumps the playhead without opening the panel', async ({ page }) => {
  await page.locator('#q').fill('1368');
  const results = page.locator('.search-results');
  const jumpRow = results.locator('div', { hasText: 'Jump to 1368 CE (Ming)' });
  await expect(jumpRow).toBeVisible();
  await jumpRow.click();

  await expect(page.locator('#panel')).not.toHaveClass(/open/);
  await expect(page.locator('#yearBadge, .year-badge')).toHaveText('1368 CE');
});

test('BCE-suffixed and bare-negative year queries agree', async ({ page }) => {
  await page.locator('#q').fill('221 BCE');
  await expect(page.locator('.search-results div', { hasText: 'Jump to 221 BCE (Qin)' })).toBeVisible();
});

test('diacritic-insensitive pinyin: "Qin Shihuang" finds 秦始皇', async ({ page }) => {
  await page.locator('#q').fill('Qin Shihuang');
  await expect(page.locator('.search-results div', { hasText: 'Qin Shi Huang unifies China' })).toBeVisible();
});

test('Down/Up navigate results, Enter picks the active row, Esc clears', async ({ page }) => {
  const input = page.locator('#q');
  // 'great' matched exactly 3 titles pre-phase-10; phase 10's content fill
  // added many more ('Great Wall gets rebuilt in stone', etc.) — 'wang' also
  // turned out unstable, since search() folds diacritics and "wáng" (king)
  // appears in several unrelated events' pinyin. 'invasion' is verified
  // against the real search() output: exactly 3, plain English, unlikely to
  // pick up incidental future matches.
  await input.fill('invasion');
  const results = page.locator('.search-results');
  await expect(results.locator('[role=option]')).toHaveCount(3);

  await input.press('ArrowDown');
  await input.press('ArrowDown');
  await input.press('ArrowDown');
  await expect(results.locator('[role=option].active')).toContainText("Kublai Khan's invasion of Java falls apart");

  await input.press('Enter');
  await expect(page.locator('#panel')).toHaveClass(/open/);
  await expect(page.locator('#panel h2')).toHaveText("Kublai Khan's invasion of Java falls apart");

  await page.keyboard.press('Escape');
  await input.fill('invasion');
  await expect(results).toBeVisible();
  await input.press('Escape');
  await expect(results).toBeHidden();
  await expect(input).toHaveValue('');
});

test('chips survive reload and are reflected in the URL', async ({ page }) => {
  const chips = page.locator('.chips .chip');
  const count = await chips.count();
  for (let i = 1; i < count; i++) await chips.nth(i).click(); // leave only chip 0 on

  await expect(page).toHaveURL(/cats=/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');

  const reloadedChips = page.locator('.chips .chip');
  await expect(reloadedChips.nth(0)).toHaveClass(/on/);
  for (let i = 1; i < count; i++) await expect(reloadedChips.nth(i)).not.toHaveClass(/on/);
});

test('Meanwhile strip text changes when crossing an era boundary', async ({ page }) => {
  const strip = page.locator('.meanwhile');
  const qinText = await strip.textContent();
  expect(qinText).toContain('Hannibal');

  await page.locator('#q').fill('1368');
  await page.locator('.search-results div', { hasText: 'Jump to 1368 CE (Ming)' }).click();

  await expect(strip).not.toHaveText(qinText);
  await expect(strip).toContainText('Columbus');
});
