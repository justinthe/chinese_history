// architecture.md §4: direct-URL build-time source. License/credit are
// supplied by the content author (validated against the license allowlist
// centrally in fetch-images.mjs, same as every other source) — this module
// only enforces the host allowlist.

/** Resolves `{ url, license, credit, licenseUrl? }`. Throws if host isn't allowlisted
 *  or license/credit is missing (architecture §3: "url form requires explicit
 *  license and credit"). */
export function resolveUrl(src, { hostAllowlist }) {
  if (!src.license || !src.credit) throw new Error(`url: ${src.url} missing required license/credit`);
  const host = new URL(src.url).hostname;
  if (!hostAllowlist.includes(host)) throw new Error(`url: host '${host}' not in fetch-images.allowlist.json`);
  return {
    downloadUrl: src.url,
    license: src.license,
    licenseUrl: src.licenseUrl || null,
    credit: src.credit,
    sourceUrl: src.url,
  };
}
