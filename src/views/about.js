// architecture.md §4: about.js — mount(el). Storyboard Screen 3, PRD F9.
import { el } from '../dom.js';
import { go } from '../router.js';

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

  wrap.append(p1, p2, ul, p3, p4, backBtn);
  section.append(wrap);
  root.append(section);
}
