// architecture.md §4: Wikimedia Commons build-time source. Pure function of
// injected deps (same DI precedent as lib/tween.js / lib/normalize.js) so
// tests/fetch-images.test.js can feed it a recorded fixture, no network.

/** Strips HTML tags from Commons' Artist/Credit extmetadata (they embed
 *  markup, e.g. `Maros M r a z (<a href=...>Maros</a>)`) — architecture §7
 *  never renders raw HTML, and a plain-text credit line is all we need. */
function stripTags(s) {
  return s.replace(/<[^>]*>/g, '').trim();
}

/**
 * Resolves `{ commons: "File:..." }` via the Commons API.
 * `getJSON(url)` is injected (defaults to fetch-based below).
 * Returns `{ downloadUrl, license, licenseUrl, credit, sourceUrl }` or
 * throws with a message identifying the failure (missing page, no imageinfo).
 */
export async function resolveCommons(title, { getJSON, userAgent }) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata|sha1&iiurlwidth=1600&format=json`;
  const json = await getJSON(api, { userAgent });
  const page = Object.values(json.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`commons: no imageinfo for ${title}`);
  const meta = info.extmetadata || {};
  const license = meta.LicenseShortName?.value;
  if (!license) throw new Error(`commons: no LicenseShortName for ${title}`);
  const artist = meta.Artist?.value ? stripTags(meta.Artist.value) : '';
  const credit = meta.Credit?.value ? stripTags(meta.Credit.value) : '';
  return {
    downloadUrl: info.thumburl || info.url,
    license,
    licenseUrl: meta.LicenseUrl?.value || null,
    credit: [artist, credit].filter(Boolean).join(', ') || 'Wikimedia Commons',
    sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
  };
}
