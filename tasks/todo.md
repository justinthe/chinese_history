# Phase 02 — UI shell with mocks

Plan: /home/jthe/.claude/plans/gentle-drifting-hopcroft.md

## Build
- [x] `src/mock-data.js` — CATS/SHAPES/ERAS/EVENTS/TOUR + eraAt/fmtYear/catColor/textOn/eventsByCats/eventsIn, lifted from mockup.html
- [x] `src/state.js` — module-level store, get/set/subscribe
- [x] `src/dom.js` — el/qs/toast helpers
- [x] `src/router.js` — mount(root)/go(screen), calls each view's returned cleanup before swapping
- [x] `src/views/landing.js`, `about.js`, `explore.js` (Screen 1/3/2 shell)
- [x] `src/views/timeline.js`, `map.js` (era bands/ticks/cards, morphing SVG map, empty state)
- [x] `src/views/detail.js`, `search.js`, `tour.js` (Screens 4/6/5)
- [x] `src/styles.css` grown from mockup.html + mobile bottom-sheet fix for the tour panel (storyboard Screen 7 gap)
- [x] `index.html` / `src/main.js` wired to the router + global detail overlay

## Tests
- [x] `tests/mock-data.test.js` — referential integrity (era/cat/related/tour refs, shape point counts, year-in-era-range with 2 documented historical exceptions)
- [x] `e2e/shell.spec.js` — journeys 1, 2, 3, 9 + no-match search + last-chip-blocked + map empty state + 360/390px viewports
- [x] `e2e/smoke.spec.js` updated (h1 text changed from placeholder to real hero markup)
- [x] `scripts/test-phase-02.sh`
- [x] `npm test`, `npm run e2e`, `npm run build` all green

## Bugs found and fixed during build
- [x] Timeline never scrolled to the initial year on mount — `tlScrollEl.clientWidth` was 0 before layout. Fixed with `requestAnimationFrame`.
- [x] Every child view's `mount()` called `state.subscribe()`/added window listeners with no teardown — repeated Explore visits would leak. Fixed: every `mount()` returns a cleanup, router calls it before the next render.

## Impeccable
- [x] `PRODUCT.md` written from PRD.md's existing interview log (no material gap needed a new user round)
- [x] Mechanical detector run on all touched files; 2 findings (`side-tab`, `border-accent-on-rounded` in styles.css) both verified as verbatim ports of a pattern already approved for mockup.html — scoped ignores added with reasons, not silently fixed or dismissed
- [x] `DESIGN.md` — palette, type ramp, named rules (One Category One Color, Two-Voice, Press-Down), elevation, shape system, all derived from shipped CSS

## Closing steps
- [x] `/ponytail-review` on the diff — 2 findings, both applied (dataset-attr drag flag → closure var; hand-built static SVG chrome → innerHTML template)
- [x] Reviewer subagent sign-off — PASS on all 7 code checks (tests, build, module contracts, scope boundary, CSP, cleanup/teardown, manual script)
- [x] `graphify` after-state — clean: state.js/dom.js are the only hubs, zero direct view-to-view edges (all 47 cross-file edges route through state.js/dom.js/router.js/mock-data.js), matches architecture.md §1/§8
- [x] Update CLAUDE.md Project State to Phase 2 complete

## Review outcome
Reviewer subagent: PASS on all 7 code checks (tests, build, module contracts,
scope boundary, CSP, cleanup/teardown, manual script). Graphify after-state:
clean, no spaghetti. Phase 02 done.

# Phase 03 — State store, data loader, content schema

Plan: /home/jthe/.claude/plans/pure-launching-naur.md

## Build
- [x] `content/{eras,events,tour,world,map-shapes,images.manifest}.json` — seeded from `src/mock-data.js`, renamed to architecture.md §3 field names (`event.year`/`category`/`whyItMatters`, `era.capital`/`capitalXY`/`oneLiner`, hanzi split from pinyin, `meanwhile` moved to `world.json`, last era `end: null`); `map-shapes.json` also gained the 4 fixed background paths (`land`/`korea`/`japan`/`rivers`) lifted out of `map.js`'s hardcoded SVG
- [x] `src/data.js` — `load(read)` (injectable reader for tests), `eraAt(year)`, `eventsIn(eraId, cats)`, `search(q)`; live-binding exports (`ERAS`/`EVENTS`/etc.) so views keep importing by name
- [x] `src/state.js` — `fromHash()`/`toHash()` URL sync (`screen`/`year`/`event`/`cats`), defensive localStorage for `cats` + `tourStop` only (architecture §7); `history.replaceState` on every `set()`, `hashchange` listener for back/forward
- [x] `src/mock-data.js` deleted; all 6 views (`detail`, `search`, `explore`, `timeline`, `map`, `tour`) repointed to `data.js`/`state.js`/`dom.js`, field names updated
- [x] `src/views/detail.js` — deep-link fallback: unresolvable `eventId` (bad `open()` call or `#event=<unknown>` from hash) → toast "Event not found. Showing the timeline instead." + explore, single `notFound()` used by both entry paths
- [x] `scripts/validate.mjs` — 11 rules (required fields, category enum, era exists, year-in-range w/ cited `redcliffs`/`revolution` exceptions, related ids resolve, unique ids, no `<`, tour ids resolve, shape resolves + 16 numbers, last-era `end: null`, every era has a world.json line); exports `validate(db)` for fixture tests
- [x] `vite.config.js` — `closeBundle` plugin copies `content/` into `dist/` (build doesn't do this automatically outside `public/`)
- [x] `src/main.js` — awaits `load()` then applies `fromHash()` before mounting; async IIFE (not top-level await — esbuild's default target predates it)
- [x] `src/dom.js` gained `textOn()` (moved from mock-data.js, shared by 3 views)

## Tests
- [x] `tests/state.test.js` — hash round-trip, unknown screen/out-of-range year/garbage cats ignored, localStorage garbage→defaults, valid localStorage respected, set() never throws on storage failure
- [x] `tests/data.test.js` — eraAt boundaries (BCE, inclusive start, exclusive end, clamped ends), search by year/title/hanzi/pinyin, 6-hit cap
- [x] `tests/validate.test.js` — one failing fixture per rule (14 cases) + base-fixture-is-valid + historical-exception-allowed
- [x] `tests/mock-data.test.js` deleted (its referential-integrity checks now live in validate.mjs)
- [x] `scripts/test-phase-03.sh` — validates content, brings up docker compose (or npm dev fallback), prints checklist
- [x] `npm test` (42/42), `npm run e2e` (10/10, all phase-02 journeys unchanged), `npm run build` all green; validate.mjs proven to fail the build on broken content and pass again once restored

## Manual verification (browser)
- [x] `#screen=explore&year=690` → Tang era, playhead 690 CE
- [x] Open event → URL gains `event=<id>`; pasted into a new tab → same panel restores (share flow, PRD flow 7)
- [x] `#event=nope` → toast "Event not found. Showing the timeline instead.", falls back to explore
- [x] Toggle a chip off, full reload with no hash → chip stays off (localStorage)

## Closing steps
- [x] `/ponytail-review` on the diff — 3 findings, all applied: dead `parseTourIdx` deleted, single-caller `readStorage` abstraction inlined, `validate.mjs`'s hardcoded category list replaced with `Object.keys(CATS)` imported from `data.js`
- [x] Reviewer subagent sign-off — SHIP: no stale field names, all §4 signatures match, all F8 rules enforced, §7 localStorage exact, tests/validate/build all re-run and green independently
- [~] `graphify` after-state — incremental `--update` mis-scanned `node_modules` despite `.gitignore` (tool-side detection bug); verified manually instead against architecture.md §4's interface table — no new cross-view edges, `mock-data.js`→`data.js` is a 1:1 topology swap, not spaghetti
- [x] Update CLAUDE.md Project State to Phase 3 complete

## Review outcome
Reviewer subagent: SHIP. All architecture §3/§4 contracts match, all PRD F8
validation rules enforced and tested, §7 localStorage scope exact, no stale
mock-data.js field references anywhere. npm test/validate/build independently
re-run and green. Graphify's automated after-state check was blocked by a
tool-side scan bug (ignored node_modules exclusion); substituted a manual
interface-table check, which passed. Phase 03 done.

# Phase 04 — Timeline

Plan: /home/jthe/.claude/plans/run-vibe-prompts-phase-04-timeline-md-an-binary-pumpkin.md

## Build
- [x] `src/lib/lanes.js` — pure sweep-line lane assignment + "+N" overflow clustering, no DOM
- [x] `src/state.js` — exported `defaultPxPerYear(viewW)` / `clampPxPerYear(px, viewW)` (previously private/inline math duplicated in timeline.js)
- [x] `src/views/timeline.js` rewrite:
  - lane-based card layout (`assignLanes`), lane count from measured pane height (2–4, capped)
  - "+N more" overflow chip using native `popover` (light-dismiss, Esc, top-layer — zero JS)
  - render split: `layoutFull()` (bands/ticks/cards, only on pxPerYear/cats/lane-count change) vs `updateCheap()` (playhead, current-era outline, glow, aria-valuenow) — keeps 150-event arrow-key spam cheap
  - tick density gains 50-year step at high zoom
  - band label hidden by text-width estimate instead of a magic `>50px` constant
  - playhead is `role="slider"` with `aria-valuemin/max/now/text`
  - cards are native `<button>` (Tab reach + Enter/Space activate for free, no roving tabindex)
  - `keydown` listener moved from module scope into `mount()`, returned in cleanup (tasks/lessons.md phase-02 rule)
  - Firefox `deltaMode` wheel fix (line vs pixel scroll)
- [x] `src/styles.css` — compact 32px card (icon chip + one-line ellipsis title + year), button resets, `:focus-visible` rings, `.ev-more`/`.more-list` popover styles

## Tests
- [x] `tests/lanes.test.js` — no-overlap property (20 random trials), full item coverage (placed or clustered), lane cap, overflow clustering, sparse case has no clusters
- [x] `tests/timeline-zoom.test.js` — default ≈2.5 screens wide, fit-all floor, 4px/year ceiling
- [x] `e2e/timeline.spec.js` (10 tests) — wheel, drag-vs-click, arrow keys ±25y, button pan ~60%/zoom-to-fit-all, no-overlap + cluster popover (+ closed-by-default regression guard), Tab+Enter, current-era band, 150-synthetic-event fixture via `page.route()`
- [x] `npm test` — 51/51 pass (incl. new files)
- [x] `npm run build` — validate + vite build clean, JS gzip 9.6KB (PRD §8 budget: 150KB)
- [x] `npm run e2e` — 18/18 pass (10 new + 8 pre-existing, no regressions)

## Manual verification (browser, via claude-in-chrome)
- [x] Real browser pass caught a bug e2e couldn't: `.more-list { display: flex }` (unconditional) defeated the popover's native closed-state `display:none`, so every "+N" list rendered open from first paint. Fixed by scoping layout to `.more-list:popover-open`; added a regression assertion in e2e/timeline.spec.js for the closed state. See tasks/lessons.md.
- [x] `+2`/`+N` cluster chip opens correct popover list, row click opens detail panel, Esc closes
- [x] Fit-all zoom (5x `－`) shows all 14 era bands incl. Xia's ✨ legendary tag, `+8` cluster for crowded PRC era, no overlaps
- [x] Tab reaches playhead (slider, focus ring) and cards; Enter opens detail
- [x] No console errors across the session
- [ ] Firefox wheel-scroll behavior — UNPROVEN (Chrome-only browser tooling available this session; fix is in place, `e2e/timeline.spec.js` cannot exercise a second browser engine)
- [ ] True 60fps measurement via Performance panel — UNPROVEN (e2e's 150-event test asserts a generous wall-clock budget, not real frame timing; flagged per phase's Validation Verification requirement rather than assumed)

## Ponytail review
- `/ponytail-review` on the diff: 1 finding — `yagni:` window resize listener recomputing lane count/zoom bounds, no PRD/phase line requires live relayout on resize. Asked the user; confirmed cut. Deleted (3 lines); re-verified tests/build/e2e still green.

## Closing steps
- [x] `/ponytail-review` — 1 finding, applied (see above)
- [x] Reviewer subagent sign-off — see Review outcome below
- [x] `scripts/test-phase-04.sh` run — docker compose healthy, prints Manual Checklist (9 items, 2 added for Firefox wheel + playhead aria-valuetext)
- [x] Update CLAUDE.md Project State to Phase 4 complete

## Review outcome
Reviewer subagent: SHIP, zero defects on static review of timeline.js,
lanes.js, state.js, styles.css, and every new test file — verified the
architecture §4 interface exactly, the two tasks/lessons.md standing rules
(rAF-deferred DOM measurement, mount() cleanup), accessibility (slider role,
native buttons, popover disclosure), and hand-traced lanes.js's no-overlap
property and full-coverage guarantee. It could not itself execute
`npm test`/`build`/`e2e` (inherited a stale plan-mode restriction mid-review);
I had already run and passed all three myself, repeatedly, most recently after
applying its one real finding (a stale comment in lanes.js — fixed) and the
ponytail-review finding (yagni resize listener — cut, user-confirmed).
Independently, a real-browser pass (claude-in-chrome) caught a genuine bug
neither e2e nor the reviewer's static read caught — a CSS `display:flex`
override defeating the native popover's closed state — fixed and covered by a
new e2e regression assertion. graphify's end-of-phase run hit the same class
of tool-side bug phase 03 flagged (this time a networkx version mismatch);
fell back to the same manual-verification precedent, which passed. Two items
explicitly UNPROVEN and reported as such rather than assumed: Firefox wheel
behavior (no Firefox available this session) and true 60fps under the
Performance panel (e2e proves a wall-clock budget, not frame timing). Phase 04
done.
