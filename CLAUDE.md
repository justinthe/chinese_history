# Middle Kingdom Explorer

Static web app that shows ~4,000 years of Chinese history on one screen: a horizontal timeline linked to a morphing map, illustrated event cards, and a guided Grand Tour.

## Project State
- Build commands: `npm ci`, `npm run build` (validate + vite build, base
  `/chinese_history/`), `npm run dev -- --host` or `docker compose up -d --wait`
  (serves http://localhost:5173/chinese_history/, bare `/` 302-redirects there).
- Test commands: `npm test` (vitest: `tests/smoke.test.js`,
  `tests/state.test.js`, `tests/data.test.js`, `tests/validate.test.js`,
  `tests/coverage.test.js`, `tests/lanes.test.js`, `tests/timeline-zoom.test.js`,
  `tests/tween.test.js`, `tests/map-pins.test.js`, `tests/focus-trap.test.js`,
  `tests/detail-render.test.js`, `tests/search.test.js`,
  `tests/chips.test.js`, `tests/tour.test.js`, `tests/fetch-images.test.js`;
  146/146 green), `npm run e2e` (playwright: `e2e/smoke.spec.js`,
  `e2e/shell.spec.js`, `e2e/timeline.spec.js`, `e2e/map.spec.js`,
  `e2e/detail.spec.js`, `e2e/search.spec.js`, `e2e/tour.spec.js`, plus new
  `e2e/helpers.js` (shared `openCardByTitle()`, not a spec file itself);
  builds + previews first; 48/48 green).
  Build-time image pipeline: `node scripts/fetch-images.mjs [--only <id>]
  [--force] [--dry-run] [--allow-missing]` (needs `FETCH_USER_AGENT` env for
  real fetches; `sharp` devDependency). Coverage report:
  `node scripts/coverage.mjs` (also runs automatically at the end of
  `node scripts/validate.mjs`/`npm run build` — warnings only, never fails
  the build). Manual check: `scripts/test-phase-10.sh` (also
  `scripts/test-phase-09.sh`/`-08.sh`/`-04.sh` through `-07.sh` still work
  for their own screens).
- Current phase: Phase 10 complete — content fill to v1 scope, per PRD §4/§7
  and the phase-10 prompt. `content/events.json` grew 28 → 157 (target
  ≥150); `content/eras.json` 14 → 18 gapless bands (added `wzhou`/`ezhou`
  splitting the old `zhou`, `jin`, `nanbei`, `wudai` filling the two year
  gaps the old 14 left uncovered — −256…−221 and 907…960, where `eraAt()`
  was silently falling through to render the PRC border); `map-shapes.json`
  grew 13 → 18 territory polygons (interpolated from neighbors, still 16
  numbers/8 points each so `tween()` morphs any pair); `world.json` 14 → 18
  lines; `content/tour.json` 10 → 20 stops. Coverage: every era ≥5 (min 5,
  max 16), every category ≥15 (dynasty 29 · war 40 · tech 21 · nature 15 ·
  people 26 · other 26 — `nature` was the tight one, topped up with two
  authored events, a 1975 Tang locust plague and the 1975 Banqiao Dam
  failure). Images: **46.5% (73/157), short of the phase checklist's ≥90%
  target — flagged, not silently passed.** ~135 events were searched against
  Commons/Met across six rounds (a keyword-only auto-pick got the wrong
  subject on the very first probe, so every candidate was reviewed by
  title/subject match, not accepted blindly); 88 got a declared source, 73
  survived the real fetch (15 failed the 150KB detail-image budget on
  complex/high-res photos — 2 were rescued with smaller alternates, the rest
  are documented failures, same runtime outcome as never declaring an image
  — icon fallback). The remaining ~84 events are mostly abstract
  administrative/institutional topics (reforms, legal systems, modern
  economic milestones) with no dedicated open-license art on Commons; per
  the user's explicit decision this session, accuracy was prioritized over
  forcing wrong-subject images to hit the number, and no AI illustrations
  were generated (none approved this session). `content/images.manifest.json`
  and `images.report.json` are committed; `public/img/` gained ~9MB of webp.
  Content-authoring method: 6 parallel subagents each drafted 3–4 eras'
  worth of new events against a shared schema/style brief (the main thread
  stayed the sole writer — merged, de-duplicated one cross-group id
  collision, assigned every new event's `xy` via a golden-angle spread
  anchored to place-name keyword matches or the era's capital, then wrote
  `content/events.json`). A subagent fact-check pass spot-checked 20 random
  events against external sources: 14/20 clean, 6 flagged (1 real year
  discrepancy, 5 overstated/conflated claims) — all 6 fixed same session,
  logged in `tasks/todo.md`. New `scripts/coverage.mjs` mirrors
  `validate.mjs`'s shape (pure `coverage()` export + guarded `main()`),
  wired into `validate.mjs`'s `main()` as a post-OK, non-blocking warnings
  section — `coverage.mjs` clusters as its own community with `validate.mjs`
  in graphify's after-state pass (cohesion 0.38), which is the *intended*
  shape since `validate.mjs` now imports and calls it directly, not spread;
  the four image-source modules stayed isolated cohesion-1.00 leaves,
  unchanged. Two real "bugs content exposes" fixed in-scope: `eras.json`'s
  year-gap coverage (fixed purely in data, no code) and
  `tests/detail-render.test.js`'s `neighbors()` test, which hardcoded
  `confucius`→`wuzetian` as adjacent 'people' events — now derives the
  expected pair from `EVENTS` itself, since phase 10 added many more
  'people' events between them. A third, smaller, non-trivial issue was
  *found but left unfixed* per the phase's scope boundary and logged in
  `tasks/todo.md`: opening an event through a timeline `+N` cluster popover,
  then closing it, doesn't return keyboard focus (the popover auto-closes
  and its content becomes unfocusable, but `detail.js`'s opener-restore only
  checks `isConnected`, not focusability) — real, content-density-exposed,
  but a `detail.js` fix, out of this phase's content-only scope.
  `/ponytail-review` on the diff: nothing to cut (`net: 0 lines possible`) —
  `coverage.mjs` mirrors an existing pattern rather than inventing one, and
  `e2e/helpers.js`'s `openCardByTitle()` is the minimum needed to make
  card-click tests robust to phase-10's new clustering. `npm test` 146/146,
  `npm run build` clean (JS gzip 11.97KB vs PRD §8's 150KB budget), `npm run
  e2e` 48/48 (all pre-existing specs, no new ones — several rewritten where
  phase-10 content changed their assumptions: a `confucius`/`wuzetian`
  hardcoded pair, `wall`'s image going from absent to present, `qin`'s
  license changing from the old CC BY-SA placeholder to a real Public-domain
  photo, and a `'wang'` search query that turned out to unexpectedly match 6
  events once diacritic-folding was accounted for, not 3 — replaced with
  `'invasion'`, verified against the real `search()` output). Real-browser
  pass (claude-in-chrome) confirmed: `wall`'s real photo + credit line
  render in the detail panel; a dense era's (Qin, 6 events) pins spread with
  no overlap; a sparse new era's (Jin, 5 events) pins likewise; Tiananmen's
  1989 detail panel reads neutrally ("Death toll unknown. Estimates …");
  Grand Tour shows "Stop 1 of 20" and advances. UNPROVEN this phase (flagged,
  not assumed): a full 20-stop Grand Tour click-through by hand — the
  automated e2e suite's tour tests (including the "Stop 20 of 20" → Finish
  path) already prove this with real waits between clicks; a manual
  brute-batch of 19 rapid clicks under-advanced, consistent with the UI
  needing real time between morph-animated stops, not a functional gap.
  Out of scope, left for a future phase: closing the images-to-90% gap
  (would need either many more hours of manual Commons/Met sourcing per
  event, reviewed AI illustrations for the abstract/administrative
  remainder, or accepting a lower target), and the popover-focus-restore
  fix in `detail.js` logged above.
- Prior phase: Phase 9 complete — build-time image pipeline finished per
  PRD F8/F9. New `scripts/fetch-images.mjs` mirrors `validate.mjs`'s shape
  (pure exports `canonicalLicense`/`sourceHash`/`run()` + a guarded `main()`)
  and resolves an event's `image` field through one of four DI'd source
  modules in `scripts/lib/sources/` — `commons.mjs` (Wikimedia API, strips
  the HTML that `extmetadata.Artist`/`Credit` embed), `met.mjs` (gates on
  `isPublicDomain === true` only, per architecture §4 — not license text),
  `url.mjs` (host allowlist + author-supplied license/credit), `local.mjs`
  (AI illustrations, exempt from the license allowlist, never downloaded).
  `run()` merges into `content/images.manifest.json` — it only ever writes
  keys for events it processed, so the phase-06 hand-written `qin` entry
  (SVG, `sourceHash: placeholder`) survives untouched; verified by test, not
  assumed. Idempotency keys off `sourceHash` (order-independent hash of the
  ImageSource object) plus the webp files actually existing; `--force`
  bypasses it, `--only`/`--dry-run`/`--allow-missing` do what their names
  say. Architecture §7's build-script rules are all live: identifying
  `User-Agent` (`FETCH_USER_AGENT` env), ~1 req/s throttle shared across
  metadata and download calls, `Content-Type` and 20MB checks before any
  `sharp` call, resize/webp quality steps down (80→60→45) until under PRD
  §8's card/detail KB budgets — a still-too-big image is a reported failure,
  never a silent overage. `scripts/validate.mjs` gained rule 12: any BY-SA
  manifest license requires the literal word "ShareAlike" in `about.js`'s
  *source* (not just the rendered page) — proven by temporarily deleting the
  notice and watching validate fail, then restoring it. `src/views/about.js`
  now renders a real Credits list from `IMAGES` (data.js) via `el()`, never
  `innerHTML`; the landing footer's "Sources & credits" mockup toast now
  really routes to it (storyboard Screen 1's spec, not a leftover stub).
  Three real seed events prove the pipeline end to end (phase 10 writes the
  other ~147): `terracotta` (Commons, CC BY-SA 3.0, real Terracotta Army
  photo), `oracle` (Met, public domain, jade water buffalo), `wall`
  (a real Commons-hosted URL declared CC BY-NC 4.0 — deliberately rejected,
  `ponytail:`-flagged for phase 10 to replace with an allowlisted source).
  The committed `content/images.report.json` shows exactly 2 fetched / 1
  rejected as the deliverable asks, exit code 1 on that state (plain run)
  vs 0 with `--allow-missing`. `npm test` 136/136 (14 files, new
  `tests/fetch-images.test.js` covers the license matcher table, sourceHash
  stability, each source module against a fixture — including the Commons
  HTML-stripping and Met `isPublicDomain: false` cases — and `run()`'s
  fetch/skip/reject/manifest-shape/merge-not-clobber behavior, no network in
  any unit test), `npm run build` clean, `npm run e2e` 48/48 (2 new rows in
  `e2e/shell.spec.js` for the Credits section and the un-stubbed footer
  link). Browser pass confirmed: terracotta's detail panel shows the real
  photo with its credit line, About lists all three manifest images with
  license links and the ShareAlike notice, and a fresh-load Network tab
  shows only `localhost:5173` + inlined `data:` font requests — zero
  third-party runtime calls (PRD §8 / architecture §7). `/ponytail-review`
  cut an IIFE in `about.js`'s credit-link rendering (inline anchor
  construction, shrunk to match the license-link branch's plain local-var
  style) and a 7× repeated deps-object literal in the new test file
  (factored into a `baseDeps()` fixture, same precedent as
  `tests/validate.test.js`'s `baseDB()`). graphify's code-only pass (scoped
  to `scripts/` + `src/views/about.js`, no LLM cost) confirmed the four
  source modules each cluster as their own isolated cohesion-1.00 leaf
  community, connected to `fetch-images.mjs` only via `imports_from` edges —
  the intended shape, not spread/spaghetti.
  Out of scope, left for phase 10: choosing/fetching images for the other
  ~147 events (`wall`'s NC-licensed seed stays rejected as a marked
  placeholder until then).
  Ready for Phase 10 (real content) per vibe-prompts/00-README.md's run order.
- Current phase: Phase 8 complete — Grand Tour finished per PRD F5.
  `src/views/tour.js` was already most of the way there from its phase-02
  port (docked panel that never covers the map, progress dots, Back/Next/
  Exit, Read more, Finish toast, `gotoStop()` driving `year`); downstream
  glue was already live too (`timeline.js`/`map.js` both compute
  `highlightId = eventId || TOUR[tourIdx]?.event` so the stop's card/pin
  already glowed, map morph and timeline auto-scroll already worked). This
  phase closed the real gaps: **resume** — new pure `resumeIdx(raw, len)`
  (out-of-range/non-integer → 0) plus `start()` reading `localStorage`'s
  `tourStop` (`state.js`'s phase-08 `ponytail:` deferral note is now
  resolved — `tour.js` owns the read, state.js still never auto-applies it
  on boot, matching storyboard Screen 5's "Resumed" state: resume happens on
  the Grand Tour button press, not on page load). **Exit clears** needed no
  new code — `state.js` already persists `tourStop` on every
  `set({tourIdx})`, so `end()`'s `tourIdx: -1` writes `"-1"`, which
  `resumeIdx` maps back to `0`; verified by test rather than assumed.
  **Keyboard** — Left/Right/Esc wired on `tourEl` itself (not `document`),
  with `e.stopPropagation()` so `timeline.js`'s document-level ±25y arrow
  handler can't double-fire on the same keypress (the one real cross-module
  hazard this phase touched; regression-tested in `e2e/tour.spec.js`).
  **a11y** — "Read more" changed from `<a href="#">` to a real `<button>`;
  focus now enters the panel on open and returns to the opener on close,
  mirroring `detail.js`'s existing `opener`/`isConnected` pattern (not a
  focus *trap* — the tour is non-modal, Tab must still reach the timeline);
  added `role="region"`/`aria-label` on the panel, `aria-live="polite"` on
  the narration, `aria-hidden` on the decorative dots. One supporting fix:
  `dom.js`'s `qs()` now defaults to `globalThis.document` and optional-
  chains the call, so `toast()` (used by `end(true)`'s completion message)
  doesn't throw under vitest's `environment: 'node'` — this is what made
  `start()`/`step()`/`end()` unit-testable without mounting DOM.
  `/ponytail-review` found nothing to cut — the diff mirrors `detail.js`'s
  existing patterns rather than inventing new ones. `npm test` 105/105,
  `npm run build` clean (JS gzip 11.70KB vs PRD §8's 150KB budget),
  `npm run e2e` 45/45. graphify's after-state run (code-only, `src/`, no
  LLM cost) confirmed `tour.js` still clusters as its own tight community
  (cohesion 0.43: `mount`/`start`/`step`/`end`/`gotoStop`/`render`, plus the
  new pure `resumeIdx` landing in the same community rather than spreading)
  — the intended shape, not spaghetti.
  Out of scope, left for phase 10: writing the real 20 tour stops —
  `content/tour.json` keeps its 10-stop seed.
  Ready for Phase 9 (content/images pipeline) or Phase 10 (real content),
  per vibe-prompts/00-README.md's run order.
- Phase 7 complete — search, category filter, Meanwhile
  strip finished per PRD F6/F7. Most of the surface already worked from the
  phase-02 mock port (chips wired to state/localStorage/URL and obeyed by
  `timeline.js`/`map.js`'s `eventsIn(eraId, cats)`; the Meanwhile strip
  already read `WORLD[era.id]` per playhead move) — this phase closed the
  real gaps. New `src/lib/normalize.js` (pure, unit-tested): `fold()`
  (NFD-strip-marks-lowercase) makes `data.search()` diacritic-insensitive on
  pinyin ("Qin Shihuang" now finds 秦始皇's toned `Qín Shǐhuáng`);
  `parseYear()` replaces a bare `parseInt` so `'221 BCE'`/`'221 BC'` parse
  to `-221` (previously only bare `-221` worked, and `'221 BCE'` silently
  landed on the wrong side of year zero). Chips (`renderChips`/`toggleCat`,
  now the pure exported `nextCats(cats, k)`) moved from `explore.js` into
  `search.js` to match architecture.md §2's "filter chips + search box"
  module ownership — confirmed with the user before moving working code;
  `explore.js` is now a thin shell (graphify's after-pass shows it dropped
  to a near-isolated 1-2-edge leaf, chips genuinely gone rather than
  duplicated). The search dropdown gained real keyboard access: `role`
  combobox/listbox/option ARIA wiring, `aria-activedescendant`, Down/Up
  wrap-around, Enter picks the active (or first) row, Esc clears — was
  click-only before except Esc. `search.js`'s `mount()` cleanup now also
  unsubscribes the chips listener (tasks/lessons.md's "every mount() that
  subscribes must return cleanup" rule). `npm test` 96/96, `npm run build`
  clean (JS gzip 11.51KB vs PRD §8's 150KB budget), `npm run e2e` 37/37.
  `/ponytail-review` cut one dead unused const (`ALL_CATS` in `search.js`,
  never read). graphify's before/after run (code-only, `src/`, no LLM cost)
  confirmed the intended shape: `search.js` clusters as its own tight
  community (`mount`+`nextCats`, cohesion 0.50) and `normalize.js` groups
  with `data.js` as its only consumer — no spaghetti.
  Ready for Phase 8 (Grand Tour).
- Phase 6 complete — event detail panel finished per PRD F4.
  `src/views/detail.js` was already most of the way there from its phase-02
  port (badges, title, hanzi/pinyin, body, why-it-matters, related chips,
  Esc/×/scrim-click, the `#event=<id>` hash round-trip from phase 03); this
  phase closed the real gaps. A genuine focus trap — new `src/lib/focus-trap.js`
  (pure, `doc` injected, same precedent as `lib/tween.js`) — installed only on
  the closed→open transition, not re-armed on a related-chip navigation while
  already open. Focus returns to the actual opener (`document.activeElement`
  captured at open) with an `isConnected` guard, since map pins are rebuilt on
  every render and a stale reference is real, not theoretical. The closed
  panel now sets `inert` (not just the `.open` CSS class), so it's genuinely
  out of the tab order rather than merely invisible — the same "visually
  closed ≠ actually non-interactive" class of bug tasks/lessons.md's popover
  lesson already covers. Prev/next switched from `visibility:hidden` to
  `disabled`: a `visibility:hidden` button still matches
  `focus-trap.js`'s `querySelectorAll` and `.focus()`-ing one is a silent
  browser no-op, which would break the trap's wraparound at a category
  boundary — `:not([disabled])` in the same selector excludes it for free.
  (This is a disclosed, deliberate deviation from the phase prompt's literal
  "hidden at ends" wording and the storyboard screenshot, flagged by the
  reviewer subagent and kept — the visible-disabled state is what's shipped.)
  New `src/icons.js`: one inline SVG glyph per `CATS` key, built with
  `createElementNS` (never `innerHTML` — architecture.md §7), used only as the
  detail hero's missing-image fallback. The hero itself now renders a real
  `<img>` from `content/images.manifest.json` when an entry exists (one real
  `qin` entry shipped, pointing at a new self-hosted `public/img/qin-detail.svg`,
  so the manifest branch is checkable by hand and not just through a mocked
  e2e route) with its credit/license line, and falls back to the category icon
  plus a debug-level (not `console.error`) `diag()` log on a missing entry or
  an `onerror`. Mobile: `.panel` gained a bottom-sheet override inside the
  existing `@media (max-width:720px)` block, same pattern as `.tour.open`.
  `mount()` now returns a cleanup (unsubscribe, remove the keydown listener,
  release any live trap) — closing the tasks/lessons.md phase-02 gap this file
  had carried since phase 02. `/ponytail-review` cut one unused parameter
  (`icon()`'s `size`, no caller ever passed a non-default) and one dead export
  (`focus-trap.js`'s `FOCUSABLE`, caught by the reviewer subagent). `npm test`
  82/82, `npm run build` clean (JS gzip 11.10KB vs PRD §8's 150KB budget),
  `npm run e2e` 31/31. UNPROVEN this phase (flagged, not assumed): a real
  visual check of the 390px bottom sheet (claude-in-chrome's window resize
  didn't take effect against this session's Linux window manager) — covered
  instead by an e2e viewport test asserting the actual panel geometry, which
  passed. Ready for Phase 7.
- Phase 5 complete — map finished per PRD F3.
  `src/views/map.js`'s `morphTo` now matches architecture.md §4's real
  contract, `morphTo(shapeKey, color)` (was `morphTo(pointsArray, color)`,
  a phase-02 leftover) — it looks the key up in `SHAPES` and delegates the
  animation to the new `src/lib/tween.js` (pure, `now`/`raf`/`cancel`
  injected so it's unit-testable under vitest's node environment; extracted
  verbatim from map.js's old inline rAF loop). Pins: `spreadPins()` (pure,
  in map.js) nudges any pins within 24px apart along their connecting
  vector, golden-angle fallback when two pins share the exact same `xy`;
  wired into `renderPins()`. Pins gained real keyboard access — `tabindex`,
  `role="button"`, `aria-label` (title/year/category), Enter/Space handler —
  replacing click-only `<g>`s; per-event icon still shown alongside the
  stroke color so color is never the sole signal (PRD §8). Map zoom ＋/－
  now does real `viewBoxFor()` math (1×–2× centred on the territory
  centroid, clamped) instead of the old `toast('Mockup: would zoom map')`
  stub. Legend now derives from `CATS` (data.js) instead of a hardcoded
  5-item list that had drifted from the six real categories. `mount()`'s
  cleanup stops an in-flight tween (tasks/lessons.md phase-02 rule). Era
  label, capital star, year badge, and empty state — already correct from
  phase 02 — are unchanged. `/ponytail-review` on the diff cut 2 redundant
  viewBox recomputes (mount() resetting to what the SVG template already
  had; render()'s per-tick reapply already covered by applyZoom/morphTo).
  `npm test` 70/70, `npm run build` clean (JS gzip 10.19KB vs PRD §8's 150KB
  budget), `npm run e2e` 25/25. graphify's end-of-phase run (scoped to
  `src/`, code-only so no LLM cost) worked clean this time — no repeat of
  phase 03/04's tool-side bugs — and confirmed `morphTo()→tween()` as a real
  cross-file edge with `tween()` sitting alone as its own single-node
  community (isolated, pure, the intended design), and every map.js function
  clustering into one cohesive community rather than spreading — not
  spaghetti. UNPROVEN this phase (flagged, not assumed): a real OS/Firefox
  prefers-reduced-motion pass (only Chrome DevTools emulation available this
  session; the code path itself is unit- and e2e-tested).
  Ready for Phase 6 (detail panel).
  `src/lib/lanes.js` (new, pure, unit-tested) does sweep-line lane assignment
  with "+N more" overflow clustering — no two cards fully overlap at default
  zoom, crowded runs (e.g. Qin, PRC) fold into a native `popover` disclosure
  list. `src/views/timeline.js` rewritten: lane count derives from measured
  pane height (2–4, capped); render split into `layoutFull()` (bands/ticks/
  cards, only on pxPerYear/cats/lane-count change) vs `updateCheap()`
  (playhead/glow/current-era, every render) keeps 150-event arrow-key panning
  cheap; tick density adds a 50-year step; playhead is `role="slider"` with
  `aria-valuemin/max/now/text`; cards are native `<button>` so Tab/Enter work
  for free, each with an explicit `aria-label` (block-content buttons don't
  reliably get a flattened accessible name); the module-scope `keydown`
  listener moved into `mount()`'s cleanup (tasks/lessons.md phase-02 rule);
  Firefox's line-mode wheel delta is scaled to pixels. `src/state.js` exported
  `defaultPxPerYear(viewW)`/`clampPxPerYear(px, viewW)` (previously private/
  duplicated). A real-browser pass caught what e2e couldn't: an unconditional
  `display:flex` on `.more-list` defeated the native popover's closed-state
  `display:none`, showing every overflow list open from first paint — fixed by
  scoping layout to `:popover-open`, with a regression e2e assertion added
  (tasks/lessons.md has the full writeup, plus a second lesson on a floating
  toolbar overlapping scrollable card lanes). `npm test` 51/51, `npm run
  build` clean (JS gzip 9.6KB vs PRD §8's 150KB budget), `npm run e2e` 18/18.
  UNPROVEN this phase (flagged, not assumed): Firefox wheel behavior
  (Chrome-only browser tooling available) and true 60fps under the Performance
  panel (e2e only proves a generous wall-clock budget for 150 events, not real
  frame timing). graphify's end-of-phase run hit a tool-side networkx version
  mismatch (`node_link_graph()` rejects `edges=`, same class of bug as phase
  03's node_modules mis-scan) — fell back to manual verification against
  architecture.md §4's interface table (`mount(el)`, `scrollToYear(y)`,
  `zoom(f)`, `pan(dir)` all still match) and confirmed `lib/lanes.js` is the
  only new node, a zero-import leaf.
  Ready for Phase 5 (map).
- Phase prompts: see vibe-prompts/00-README.md for run order.
- Ponytail level: ultra. Model switching: Opus plan / Sonnet build.

## Key Context Files
- PRD.md · architecture.md · storyboard.md + images/
- vibe-pipeline-state.md (pipeline history)

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detaild specs upfront to reduce ambiguity
- Always use `graphify` at the start of planning to map out existing architecture and proposed changes.

### 2. Subagent strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problem, throw more compute at it via subagents
- One task per subagent for focus execution
- Provide subagents with `graphify` outputs to ensure they have an immediate visual understanding of the codebase segment they are working on.

### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at the session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Use `graphify` to verify the "After" state matches the intended architectural design.
- Diff behavior between main and your changes when relevant
- Ask yoursef: "Would a staff engineer approve this?"
- Run test, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- Visualize the solution with `graphify`—if the resulting graph looks like "spaghetti," the solution is not elegant.
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Run `graphify` on the affected module to find hidden dependencies causing the bug.
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Run `graphify` and Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to 'tasks/todo.md'
6. **Capture Lessons**: Update 'tasks/lessons.md' after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **Visual Grounding**: Always use `graphify` to maintain a mental map of the project.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.