// architecture.md §3: AI illustrations dropped in content/img-src/, never
// downloaded and exempt from the license allowlist (license is literally
// "Illustration" — it's ours, not a scraped work). No network at all.

import { existsSync } from 'node:fs';

/** Resolves `{ local: "img-src/x.png", license, credit }`. Throws if the
 *  file doesn't exist under `contentDir`. */
export function resolveLocal(src, { contentDir }) {
  if (!src.license || !src.credit) throw new Error(`local: ${src.local} missing required license/credit`);
  const filePath = `${contentDir}${src.local}`;
  if (!existsSync(filePath)) throw new Error(`local: file not found: ${filePath}`);
  return {
    filePath,
    license: src.license,
    licenseUrl: null,
    credit: src.credit,
    sourceUrl: null,
    exemptFromLicenseAllowlist: true,
  };
}
