# Middle Kingdom Explorer

Static web app that shows ~4,000 years of Chinese history on one screen: a horizontal timeline linked to a morphing map, illustrated event cards, and a guided Grand Tour.

## Project State
- Build commands: `npm ci`, `npm run build` (validate + vite build, base
  `/chinese_history/`), `npm run dev -- --host` or `docker compose up -d --wait`
  (serves http://localhost:5173/chinese_history/, bare `/` 302-redirects there).
- Test commands: `npm test` (vitest: `tests/smoke.test.js`,
  `tests/state.test.js`, `tests/data.test.js`, `tests/validate.test.js`,
  `tests/lanes.test.js`, `tests/timeline-zoom.test.js`, `tests/tween.test.js`,
  `tests/map-pins.test.js`, `tests/focus-trap.test.js`,
  `tests/detail-render.test.js`, `tests/search.test.js`,
  `tests/chips.test.js`), `npm run e2e` (playwright:
  `e2e/smoke.spec.js`, `e2e/shell.spec.js`, `e2e/timeline.spec.js`,
  `e2e/map.spec.js`, `e2e/detail.spec.js`, `e2e/search.spec.js`; builds +
  previews first). Manual check: `scripts/test-phase-07.sh` (runs
  `node scripts/validate.mjs` too; `scripts/test-phase-04.sh` through
  `-06.sh` still work for their own screens).
- Current phase: Phase 7 complete — search, category filter, Meanwhile
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