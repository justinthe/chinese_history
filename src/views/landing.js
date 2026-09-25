// architecture.md §4: landing.js — mount(el). Storyboard Screen 1.
import { el } from '../dom.js';
import { go } from '../router.js';
import { open as openEvent } from './detail.js';
import { start as startTour } from './tour.js';

const TEASERS = [
  { icon: '📄', title: "Paper was a eunuch's idea", text: 'Cai Lun, 105 CE. Before that: bamboo strips and silk. Tap to see how it spread.', eventId: 'paper' },
  { icon: '👑', title: 'China had one female emperor', text: 'Wu Zetian ruled in her own name, 690–705. Not empress. Emperor.', eventId: 'wuzetian' },
  { icon: '⛵', title: "Ships bigger than Columbus's", text: "Zheng He's treasure fleet reached Africa 87 years before 1492. Then China stopped sailing.", eventId: 'zhenghe' },
  { icon: '🌋', title: 'Deadliest earthquake ever', text: 'Shaanxi, 1556. ~830,000 dead. Why so many? People lived in cliff caves.', eventId: 'shaanxi' },
];

const HOWTO = [
  ['🖱️', 'Drag or click timeline to travel'],
  ['🗺️', 'Watch borders shift on the map'],
  ['📌', 'Tap any card or pin for the story'],
  ['🔍', 'Search a name or a year'],
];

const FLOATS = [
  { icon: '🐉', style: { left: '8%', top: '40px' }, delay: '0s' },
  { icon: '🏯', style: { right: '10%', top: '60px' }, delay: '.6s' },
  { icon: '📜', style: { left: '18%', bottom: '10px' }, delay: '1.2s' },
  { icon: '⚔️', style: { right: '20%', bottom: '0' }, delay: '1.8s' },
];

export function mount(root) {
  const section = el('section');
  section.id = 'landing';
  section.className = 'screen active';

  const hero = el('div', 'hero');
  FLOATS.forEach(({ icon, style, delay }) => {
    const f = el('span', 'float', icon);
    Object.assign(f.style, style);
    f.style.animationDelay = delay;
    hero.append(f);
  });
  const h1 = el('h1');
  h1.append('Middle Kingdom', el('br'), el('span', null, 'Explorer'));
  const tag = el('p', 'tag', '4,000 years of emperors, inventions, floods and revolutions. One scrolling timeline, one living map. No homework required.');
  const actions = el('div', 'actions');
  const exploreBtn = el('button', 'btn', '🧭 Explore freely');
  exploreBtn.addEventListener('click', () => go('explore'));
  const tourBtn = el('button', 'btn gold', '🎒 Take the Grand Tour');
  tourBtn.addEventListener('click', () => { go('explore'); startTour('grand'); });
  const wuxiaBtn = el('button', 'btn ink', '🥋 Wuxia Tour');
  wuxiaBtn.addEventListener('click', () => { go('explore'); startTour('wuxia'); });
  actions.append(exploreBtn, tourBtn, wuxiaBtn);
  hero.append(h1, tag, actions);

  const teasers = el('div', 'teasers');
  TEASERS.forEach((t) => {
    // A heading isn't valid inside a <button> — role="button" + tabindex + Enter/Space
    // matches map.js's pin pattern, same reasoning: keyboard access without breaking markup.
    const card = el('div', 'teaser');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${t.title} — open this event`);
    card.append(el('div', 'big', t.icon), el('h2', null, t.title), el('p', null, t.text));
    const openTeaser = () => { go('explore'); openEvent(t.eventId); };
    card.addEventListener('click', openTeaser);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTeaser(); }
    });
    teasers.append(card);
  });

  const howto = el('div', 'howto');
  HOWTO.forEach(([icon, text]) => {
    const line = el('div');
    line.append(icon + ' ', el('span', null, text));
    howto.append(line);
  });

  const footer = el('div', 'footer-links');
  const aboutLink = el('a', null, 'About this project');
  aboutLink.href = '#';
  aboutLink.addEventListener('click', (e) => { e.preventDefault(); go('about'); });
  const creditsLink = el('a', null, 'Sources & credits');
  creditsLink.href = '#';
  creditsLink.addEventListener('click', (e) => { e.preventDefault(); go('about'); });
  footer.append(aboutLink, ' · ', creditsLink);

  section.append(hero, teasers, howto, footer);
  root.append(section);
}
