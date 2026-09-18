// architecture.md §4: detail.js — mount(el), open(eventId), close(). Global
// overlay (scrim + slide-in panel), mounted once by main.js so it can open
// over any screen (storyboard Screen 4).
import { EVENTS, ERAS, CATS, fmtYear } from '../data.js';
import { get, set, subscribe } from '../state.js';
import { el, toast, textOn } from '../dom.js';

let panelEl, scrimEl, artEl, badgesEl, titleEl, hanziEl, bodyEl, whyEl, relatedEl, prevBtn, nextBtn;

function badge(text, bg) {
  const b = el('span', 'badge', text);
  b.style.background = bg;
  b.style.color = bg.startsWith('#') ? textOn(bg) : '#fff';
  return b;
}

export function mount(root) {
  scrimEl = el('div', 'scrim');
  scrimEl.id = 'scrim';
  scrimEl.addEventListener('click', close);

  panelEl = el('aside', 'panel');
  panelEl.id = 'panel';
  panelEl.setAttribute('aria-modal', 'true');
  panelEl.setAttribute('role', 'dialog');

  const closeBtn = el('button', 'close', '✕');
  closeBtn.addEventListener('click', close);

  artEl = el('div', 'art');
  const content = el('div', 'content');
  badgesEl = el('div', 'badges');
  titleEl = el('h2');
  hanziEl = el('div', 'hz');
  bodyEl = el('div');
  const why = el('div', 'why');
  why.append(el('b', null, '💡 Why it matters'), (whyEl = el('span')));
  const relatedLabel = el('div', 'fredoka', 'Related');
  relatedLabel.style.marginBottom = '6px';
  relatedEl = el('div', 'related');
  const navRow = el('div', 'nav-row');
  prevBtn = el('button', 'btn ghost sm', '← Prev');
  nextBtn = el('button', 'btn ghost sm', 'Next →');
  navRow.append(prevBtn, nextBtn);
  const credit = el('div', 'credit', 'Image: placeholder. Production: PD artwork / custom illustration with credit line.');

  content.append(badgesEl, titleEl, hanziEl, bodyEl, why, relatedLabel, relatedEl, navRow, credit);
  panelEl.append(closeBtn, artEl, content);
  root.append(scrimEl, panelEl);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && get().eventId) close();
  });

  subscribe(render);
  render();
}

/** Storyboard Screen 4 "deep-link error" state: unresolvable event id, from
 *  open() with a bad id or from a `#event=<unknown>` hash on boot/back-forward. */
function notFound() {
  toast('Event not found. Showing the timeline instead.');
  set({ eventId: null, screen: 'explore' });
}

/** Opens the panel for an event id and jumps the shared year to it. */
export function open(id) {
  const ev = EVENTS.find((e) => e.id === id);
  if (!ev) return notFound();
  set({ eventId: id, year: ev.year });
}

export function close() {
  if (get().eventId) set({ eventId: null });
}

function render() {
  const { eventId } = get();
  if (!eventId) {
    panelEl.classList.remove('open');
    scrimEl.classList.remove('open');
    return;
  }
  const ev = EVENTS.find((e) => e.id === eventId);
  if (!ev) return notFound();
  const era = ERAS.find((e) => e.id === ev.era);
  const cat = CATS[ev.category];

  artEl.textContent = ev.icon;
  badgesEl.textContent = '';
  badgesEl.append(
    badge(`${cat.icon} ${cat.label}`, cat.color),
    badge(era.name, era.color),
    badge(fmtYear(ev.year), 'var(--ink)')
  );
  if (ev.legendary) badgesEl.append(badge('✨ Legend', 'var(--plum)'));

  titleEl.textContent = ev.title;
  hanziEl.textContent = `${ev.hanzi} · ${ev.pinyin}`;

  bodyEl.textContent = '';
  ev.body.forEach((p) => bodyEl.append(el('p', null, p)));
  whyEl.textContent = ev.whyItMatters;

  relatedEl.textContent = '';
  ev.related.forEach((r) => {
    const re = EVENTS.find((e) => e.id === r);
    if (!re) return;
    const btn = el('button', null, `${re.icon} ${re.title}`);
    btn.addEventListener('click', () => open(r));
    relatedEl.append(btn);
  });

  const same = EVENTS.filter((e) => e.category === ev.category);
  const i = same.indexOf(ev);
  prevBtn.style.visibility = i > 0 ? 'visible' : 'hidden';
  nextBtn.style.visibility = i < same.length - 1 ? 'visible' : 'hidden';
  prevBtn.onclick = () => open(same[i - 1]?.id);
  nextBtn.onclick = () => open(same[i + 1]?.id);

  panelEl.classList.add('open');
  scrimEl.classList.add('open');
  panelEl.scrollTop = 0;
}
