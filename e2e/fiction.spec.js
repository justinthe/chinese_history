import { test, expect } from '@playwright/test';

// Fiction layer: the 7th category (on by default, its own chip), the fiction
// card's source line + Wikipedia link, and the Wuxia Tour (its own stops and
// its own resume point, independent of the Grand Tour).

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

test('Fiction chip is on by default and hides fiction cards when switched off', async ({ page }) => {
  await page.goto('./#screen=explore&year=1239');
  const chip = page.locator('.chips .chip', { hasText: 'Fiction' });
  await expect(chip).toHaveClass(/on/);
  const fictionCards = page.locator('.ev .fiction-tag');
  await expect(fictionCards.first()).toBeVisible();

  await chip.click();
  await expect(chip).not.toHaveClass(/on/);
  await expect(fictionCards).toHaveCount(0);
  await expect(page.locator('.more-row', { hasText: 'Yang Guo and Xiaolongnü' })).toHaveCount(0);
});

test('fiction detail shows where the story comes from and links to Wikipedia', async ({ page }) => {
  await page.goto('./#event=condor-huashan-contest');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect(panel.locator('.badge', { hasText: 'Fiction' })).toBeVisible();
  await expect(panel.locator('.source')).toContainText('The Legend of the Condor Heroes');
  await expect(panel.locator('.source')).toContainText('Jin Yong');
  const wiki = panel.locator('a.wiki');
  await expect(wiki).toHaveText('Read the full story on Wikipedia ↗');
  await expect(wiki).toHaveAttribute('href', /^https:\/\/en\.wikipedia\.org\/wiki\//);
  await expect(wiki).toHaveAttribute('rel', 'noopener');
});

test('moving from a fiction card to a non-fiction one clears the source line and wiki link', async ({ page }) => {
  // The panel is reused across events, so a stale fiction line must not survive
  // into a card without one (a CSS display rule on the element would silently
  // defeat its [hidden] attribute).
  await page.goto('./#event=condor-huashan-contest');
  await expect(page.locator('html')).toHaveAttribute('data-app', 'ready');
  const panel = page.locator('#panel');
  await expect(panel.locator('a.wiki')).toBeVisible();
  await page.goto('./#event=qin');
  await expect(panel.locator('h2')).not.toContainText('Mount Hua');
  await expect(panel.locator('.source')).toBeHidden();
  await expect(panel.locator('a.wiki')).toBeHidden();
});

test('Wuxia Tour runs its own stops and leaves Grand Tour progress alone', async ({ page }) => {
  // Grand Tour to stop 2, then exit via starting the Wuxia Tour from the topbar.
  await page.locator('.hero .actions .btn.gold', { hasText: 'Take the Grand Tour' }).click();
  const tour = page.locator('.tour');
  await tour.locator('button', { hasText: 'Next →' }).click();
  await expect(tour.locator('h3')).toContainText('Stop 2 of 20');

  await page.locator('.topbar .btn.ink', { hasText: 'Wuxia Tour' }).click();
  await expect(tour).toHaveAttribute('aria-label', 'Wuxia Tour');
  await expect(tour.locator('h3')).toContainText('Stop 1 of 20');
  await expect(tour.locator('h3')).toContainText('A shepherd girl with a sword');
  await expect(page.locator('.ev.glow, .ev-more.glow')).toHaveCount(1);
  await tour.locator('button', { hasText: 'Next →' }).click();
  await expect(tour.locator('h3')).toContainText('The monk from the west');

  // Back to the Grand Tour: resumes where it was, not at the wuxia index.
  await page.locator('.topbar .btn.gold', { hasText: 'Grand Tour' }).click();
  await expect(tour).toHaveAttribute('aria-label', 'Grand Tour');
  await expect(tour.locator('h3')).toContainText('Stop 2 of 20');
});

test('Wuxia Tour starts from the landing page', async ({ page }) => {
  await page.locator('.hero .actions .btn.ink', { hasText: 'Wuxia Tour' }).click();
  const tour = page.locator('.tour');
  await expect(tour).toHaveClass(/open/);
  await expect(tour).toHaveAttribute('aria-label', 'Wuxia Tour');
});
