// Phase 10 added many more events per era, so a named card is no longer
// guaranteed to render directly — it may fold into a timeline.js "+N" cluster
// popover instead (src/views/timeline.js's `.more-list`/`.more-row`, same
// title markup as a plain `.ev b`). Clicks a visible card if there is one,
// otherwise opens its cluster and clicks the matching row inside it.
// Returns the locator actually clicked (the real focus-return opener),
// so callers assert focus against the right element either way.
export async function openCardByTitle(page, title) {
  const direct = page.locator('.ev', { hasText: title });
  if (await direct.count()) {
    await page.locator('.ev b', { hasText: title }).click();
    return direct;
  }
  // All clusters' `.more-row` lists exist in the DOM from initial render
  // (layoutFull() builds every cluster's popover up front, not lazily on
  // click) — a plain .count() is truthy even for a closed popover elsewhere
  // on the page, so this must check visibility (native `popover=auto` only
  // shows the one currently open), not existence.
  const row = page.locator('.more-row', { hasText: title });
  const more = page.locator('.ev-more');
  const count = await more.count();
  for (let i = 0; i < count; i++) {
    await more.nth(i).click();
    if (await row.isVisible()) {
      await row.click();
      return row;
    }
  }
  throw new Error(`openCardByTitle: no direct card or cluster row found for "${title}"`);
}
