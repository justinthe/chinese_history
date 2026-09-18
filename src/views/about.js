// architecture.md §4: about.js — mount(el). Storyboard Screen 3, PRD F9.
import { el } from '../dom.js';
import { go } from '../router.js';
import { IMAGES } from '../data.js';

const CATEGORIES = [
  ['👑', 'Government and dynasties'],
  ['⚔️', 'Wars and rebellions'],
  ['⚙️', 'Technology and invention'],
  ['🌊', 'Nature and disasters'],
  ['👤', 'Famous figures and why they matter'],
  ['📰', 'Other big news'],
];

export function mount(root) {
  const section = el('section');
  section.id = 'about';
  section.className = 'screen active';

  const wrap = el('div', 'wrap');
  wrap.append(el('h1', null, 'About'));

  const p1 = el('p');
  p1.append(el('b', null, 'Middle Kingdom Explorer'), ' is a free, ad-free way to see the whole shape of Chinese history without reading a 600-page book first.');
  const p2 = el('p', null, 'We cover roughly 4,000 years, from the legendary Xia dynasty to the present day, across six threads:');

  const ul = el('ul');
  CATEGORIES.forEach(([icon, text]) => ul.append(el('li', null, `${icon} ${text}`)));

  const p3 = el('p', null, 'Legendary content is clearly badged. Modern events are described factually and neutrally, with sources. Images come from public-domain collections, our own icon set, and reviewed AI illustrations. Every image carries a credit.');
  const p4 = el('p', null, 'Built as a static site. No accounts, no tracking beyond a page count.');

  const backBtn = el('button', 'btn', '← Back');
  backBtn.addEventListener('click', () => go('landing'));

  wrap.append(p1, p2, ul, p3, p4, buildCredits(), backBtn);
  section.append(wrap);
  root.append(section);
}

/** PRD F9: renders every fetched image's credit + license (scripts/fetch-images.mjs
 *  writes content/images.manifest.json; IMAGES is data.js's live binding of it).
 *  Static content only — no subscription, so no cleanup to return. */
function buildCredits(images = IMAGES) {
  const frag = el('div');
  const entries = Object.entries(images);
  frag.append(el('h2', null, 'Credits'));
  if (entries.length === 0) {
    frag.append(el('p', null, 'No fetched images yet.'));
    return frag;
  }

  const list = el('ul', 'credits-list');
  entries.forEach(([id, img]) => {
    const li = el('li');
    li.append(el('span', 'credit-alt', img.alt), ' — ', document.createTextNode(`${img.credit}, `));
    if (img.licenseUrl) {
      const a = el('a', null, img.license);
      a.href = img.licenseUrl;
      a.rel = 'noopener';
      li.append(a);
    } else {
      li.append(document.createTextNode(img.license));
    }
    if (img.sourceUrl) {
      const src = el('a', null, 'source');
      src.href = img.sourceUrl;
      src.rel = 'noopener';
      li.append(' (', src, ')');
    }
    list.append(li);
  });
  frag.append(list);

  // architecture §4: CC BY-SA requires the ShareAlike notice once any image
  // uses it — validate.mjs's rule 12 checks this file's source for the word.
  if (entries.some(([, img]) => /BY-SA/i.test(img.license || ''))) {
    frag.append(el('p', 'sa-notice', 'Some images are licensed CC BY-SA (ShareAlike): reuse of this page’s content must credit the same source and license, under the same terms.'));
  }

  return frag;
}
