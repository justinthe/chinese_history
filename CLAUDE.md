# Middle Kingdom Explorer

Static web app that shows ~4,000 years of Chinese history on one screen: a horizontal timeline linked to a morphing map, illustrated event cards, and a guided Grand Tour.

## Project State
- Build commands: `npm ci`, `npm run build` (validate + vite build, base
  `/chinese_history/`), `npm run dev -- --host` or `docker compose up -d --wait`
  (serves http://localhost:5173/chinese_history/, bare `/` 302-redirects there).
- Test commands: `npm test` (vitest: `tests/smoke.test.js`,
  `tests/state.test.js`, `tests/data.test.js`, `tests/validate.test.js`,
  `tests/lanes.test.js`, `tests/timeline-zoom.test.js`), `npm run e2e`
  (playwright: `e2e/smoke.spec.js`, `e2e/shell.spec.js`, `e2e/timeline.spec.js`;
  builds + previews first). Manual check: `scripts/test-phase-04.sh` (runs
  `node scripts/validate.mjs` too).
- Current phase: Phase 4 complete — timeline finished per PRD F2.
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