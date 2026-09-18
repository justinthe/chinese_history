// architecture.md §4: detail.js — mount(el), open(eventId), close(). Global
// overlay (scrim + slide-in panel), mounted once by main.js so it can open
// over any screen (storyboard Screen 4).
import { EVENTS, ERAS, CATS, IMAGES, fmtYear } from '../data.js';
import { get, set, subscribe } from '../state.js';
import { el, toast, textOn } from '../dom.js';
import { icon } from '../icons.js';
import { trap } from '../lib/focus-trap.js';

let panelEl, scrimEl, artEl, badgesEl, titleEl, hanziEl, bodyEl, whyEl, relatedEl, prevBtn, nextBtn, creditEl;
let lastId = null; // re-render guard: only rebuild content on an actual eventId change
let opener = null; // element to return focus to on close
let releaseTrap = null;

function badge(text, bg) {
  const b = el('span', 'badge', text);
  b.style.background = bg;
  b.style.color = bg.startsWith('#') ? textOn(bg) : '#fff';
  return b;
}

/** PRD §8 image onerror: {ts, eventId, src} logged, never console.error — the
 *  manifest has one entry today (phase 09 populates the rest), so a miss is
 *  the expected common case, not a test-failing error (e2e/shell.spec.js
 *  fails on any console.error). */
function diag(msg, data) {
  console.debug('[diag]', msg, { ts: Date.now(), ...data });
}

/** Resolves an event's manifest image, or null (caller falls back to the
 *  category icon). Pure — `images` injected for tests. */
export function imageFor(id, images = IMAGES) {
  const entry = images[id];
  if (!entry) return null;
  const base = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.BASE_URL : '/';
  return { src: `${base}${entry.detail}`, alt: entry.alt, credit: entry.credit, license: entry.license, licenseUrl: entry.licenseUrl };
}

/** Same-category neighbors by year (chronological, not content/events.json's
 *  incidental file order). Pure — `events` injected for tests. */
export function neighbors(ev, events = EVENTS) {
  const same = events.filter((e) => e.category === ev.category).sort((a, b) => a.year - b.year);
  const i = same.indexOf(ev);
  return { prev: same[i - 1] || null, next: same[i + 1] || null };
}

export function mount(root) {
  scrimEl = el('div', 'scrim');
  scrimEl.id = 'scrim';
  scrimEl.addEventListener('click', close);

  panelEl = el('aside', 'panel');
  panelEl.id = 'panel';
  panelEl.setAttribute('aria-modal', 'true');
  panelEl.setAttribute('role', 'dialog');
  panelEl.setAttribute('tabindex', '-1');
  panelEl.inert = true;

  const closeBtn = el('button', 'close', '✕');
  closeBtn.addEventListener('click', close);

  artEl = el('div', 'art');
  const content = el('div', 'content');
  badgesEl = el('div', 'badges');
  titleEl = el('h2');
  titleEl.id = 'panel-title';
  panelEl.setAttribute('aria-labelledby', 'panel-title');
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
  creditEl = el('div', 'credit');

  content.append(badgesEl, titleEl, hanziEl, bodyEl, why, relatedLabel, relatedEl, navRow, creditEl);
  panelEl.append(closeBtn, artEl, content);
  root.append(scrimEl, panelEl);

  function onKeydown(e) {
    if (e.key === 'Escape' && get().eventId) close();
  }
  document.addEventListener('keydown', onKeydown);

  const unsubscribe = subscribe(render);
  render();

  return () => {
    unsubscribe();
    document.removeEventListener('keydown', onKeydown);
    releaseTrap?.();
  };
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

/** Restores focus to the element that opened the panel. `isConnected` alone isn't enough:
 *  an opener inside a `.more-list` [popover] auto-dismisses when the panel opens, which
 *  makes its contents unfocusable (offsetParent null) while staying connected — falls back
 *  to the `.ev-more` chip that controls that popover, which stays focusable throughout. */
function focusOpener() {
  if (!opener?.isConnected) return;
  if (opener.offsetParent !== null) return opener.focus();
  const popover = opener.closest('[popover]');
  const chip = popover && document.querySelector(`[popovertarget="${popover.id}"]`);
  chip?.focus();
}

function render() {
  const { eventId } = get();

  if (!eventId) {
    panelEl.classList.remove('open');
    scrimEl.classList.remove('open');
    panelEl.inert = true;
    document.getElementById('app').inert = false;
    releaseTrap?.();
    releaseTrap = null;
    focusOpener();
    opener = null;
    lastId = null;
    return;
  }

  const ev = EVENTS.find((e) => e.id === eventId);
  if (!ev) return notFound();

  const opening = lastId !== eventId; // only rebuild content on a real event change
  lastId = eventId;

  if (opening) {
    const era = ERAS.find((e) => e.id === ev.era);
    const cat = CATS[ev.category];

    artEl.textContent = '';
    const img = imageFor(ev.id);
    if (img) {
      const imgEl = el('img');
      imgEl.loading = 'lazy';
      imgEl.decoding = 'async';
      imgEl.alt = img.alt;
      imgEl.src = img.src;
      imgEl.onerror = () => {
        diag('detail image failed to load', { eventId: ev.id, src: img.src });
        artEl.textContent = '';
        artEl.append(icon(ev.category));
        creditEl.textContent = '';
      };
      artEl.append(imgEl);
      creditEl.textContent = '';
      creditEl.append(document.createTextNode(`Image: ${img.credit} · `));
      const lic = el('a', null, img.license);
      lic.href = img.licenseUrl;
      lic.target = '_blank';
      lic.rel = 'noopener';
      creditEl.append(lic);
    } else {
      diag('no manifest entry, using category icon', { eventId: ev.id });
      artEl.append(icon(ev.category));
      creditEl.textContent = '';
    }

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

    const { prev, next } = neighbors(ev);
    prevBtn.disabled = !prev;
    nextBtn.disabled = !next;
    prevBtn.onclick = () => open(prev?.id);
    nextBtn.onclick = () => open(next?.id);

    panelEl.scrollTop = 0;
  }

  if (!panelEl.classList.contains('open')) {
    opener = document.activeElement;
    panelEl.classList.add('open');
    scrimEl.classList.add('open');
    panelEl.inert = false;
    document.getElementById('app').inert = true; // scrim covers it visually; inert keeps AT out too
    panelEl.focus();
    releaseTrap = trap(panelEl);
  }
}
