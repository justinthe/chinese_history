// architecture.md §4: Met Open Access build-time source. Pure, DI'd, same
// shape as commons.mjs.

/**
 * Resolves `{ met: objectId }` via the Met Collection API.
 * Rejects (throws) unless `isPublicDomain === true` — architecture §4 is
 * explicit: only that field, not license text, gates Met images.
 */
export async function resolveMet(objectId, { getJSON }) {
  const api = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`;
  const json = await getJSON(api, {});
  if (json.isPublicDomain !== true) throw new Error(`met: object ${objectId} is not public domain`);
  if (!json.primaryImage) throw new Error(`met: object ${objectId} has no primaryImage`);
  const credit = [json.artistDisplayName, json.creditLine].filter(Boolean).join(', ') || 'The Met, Open Access';
  return {
    downloadUrl: json.primaryImage,
    license: 'Public domain',
    licenseUrl: null,
    credit,
    sourceUrl: `https://www.metmuseum.org/art/collection/search/${objectId}`,
  };
}
