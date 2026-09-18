# Phase 04 — Timeline · Middle Kingdom Explorer

> Run in a fresh Claude Code session (or /clear) with PRD.md,
> architecture.md, storyboard.md, and CLAUDE.md in the workspace. Read
> CLAUDE.md first, enter plan mode before implementing, and verify ponytail
> is active. Portable: outside Claude Code, load and run this prompt via
> Caveman.

## Context Initialization
This session builds exactly the following, and nothing else:
- `src/views/timeline.js` finished per PRD F2: wheel → horizontal, click-drag pan with click-vs-drag threshold, ◀ ▶ buttons, arrow keys ±25 years, scrollbar
- Zoom: default = 2.5 screens wide, min = fit-all, max 4 px/year; tick density adapts (500/250/100/50 years)
- Card collision layout: lane assignment so no two cards fully overlap at default zoom (sweep-line, lanes ≤ 4; overflow collapses into a '+N more' card that opens a small list)
- Era bands with current-era highlight; band label hidden when narrower than its text
- Keyboard: Tab reaches cards in year order, Enter opens; playhead has `aria-valuenow` as a slider
- Performance: 150 synthetic events render and scroll at 60 fps (measure with Performance panel; DOM is fine, switch to canvas only if measured < 50 fps)
Reference: PRD.md §5 F2, §8 Performance and Accessibility; architecture.md §1 runtime, §4 `timeline.js` interface; storyboard.md screen 2.

## Scope Boundary
- In scope:
  - Everything inside the timeline pane and its tools
- Out of scope — do NOT touch:
  - Map, detail, tour, search internals
  - Content beyond a synthetic 150-event fixture used only in tests

## Guardrails (mandatory in EVERY phase — never drop or abbreviate)
- **Containerization & Structure:** All code adheres to isolated
  environment principles. This is a static site: the only container is the
  `node:20-alpine` dev toolchain in `docker-compose.yml` (architecture §5),
  serving Vite on port 5173. Zero runtime npm dependencies; `sharp`, `vite`,
  `vitest`, `playwright` are dev-only and never ship to the browser. All
  content is JSON under `content/`, all static assets under `public/`.
- **Graphify (required, start AND end of this phase):**
  - At the start, run `graphify` to map the existing architecture of the
    module(s) this phase touches plus the proposed changes, before writing
    any code.
  - Use the graph to find hidden dependencies that this phase could break.
  - At the end, run `graphify` again to verify the resulting "after" state
    matches the intended design — if the graph looks like spaghetti, the
    solution is not elegant; simplify before closing the phase.
- **Recall (required, throughout):** Use `recall` to cross-reference prior
  state and context — CLAUDE.md, tasks/todo.md, tasks/lessons.md, and
  earlier phases' code and tests — before and during implementation, so
  this phase does not regress or contradict work already approved.
- **TDD:** Write automated tests alongside or prior to the implementation.
  All tests from previous phases must still pass.
- **Ponytail (required, level: ultra):** Verify the ponytail plugin is
  active at this level before writing code (`/ponytail` reports the current
  level; set it with `/ponytail ultra` if needed). Apply its ladder to every
  change: does this need to exist → reuse what's in the codebase → stdlib →
  native platform feature → installed dependency → one line → only then the
  minimum that works. Never cut validation, error handling, security, or
  accessibility in its name.
- **Multi-Agent Execution (required):**
  1. Scout first: spawn a subagent to run graphify + recall on the
     modules this phase touches and report back the dependency map plus
     relevant prior context, before any implementation starts.
  2. Parallelize research: independent exploration/analysis tasks each go
     to their own subagent — one task per subagent — fed the scout's
     graphify output.
  3. Implement in the main thread: a single writer avoids file conflicts
     between agents.
  4. Review before close: a separate reviewer subagent independently
     verifies the phase — tests pass, the storyboard/walkthrough contract
     is met — before the phase is marked done.
- **State Management:** Before finishing, update CLAUDE.md: build
  commands, test commands, and current development state.
- **Tooling Protocol:** Primary runner is Claude Code — enter plan mode
  before implementing, per CLAUDE.md. For portability, when running
  outside Claude Code, load and execute this prompt via Caveman.
- **Model Switching (default: Opus-plan/Sonnet-build, per
  vibe-pipeline-state.md):** Unless the state file records an opt-out, run
  `/model opus` before entering plan mode; once the plan is reviewed and
  accepted, run `/model sonnet` before writing any code. Override anytime
  by running `/model <name>` yourself — the default is a starting point,
  not a lock.

## Visual Reference
images/screen-02-explore.png — timeline pane at the bottom (bands, cards, ticks, playhead, tools). Cards must keep the icon-chip + title + year layout; only their vertical lane placement changes.

If the impeccable skill is installed (00-README.md one-time setup), close
the phase by running `/impeccable polish <target>` on each screen this
phase touched and resolving what it flags, before Validation Verification —
real design craft feedback on the real UI code, not the throwaway mockup.
Skip this step entirely if impeccable isn't installed.

## Deliverables
- `src/views/timeline.js`, `src/lib/lanes.js` (pure lane assignment, unit-tested)
- vitest: `tests/lanes.test.js` (no overlap property on random fixtures, +N overflow), `tests/timeline-zoom.test.js` (fit-all floor, default width)
- e2e: `e2e/timeline.spec.js` drag, wheel, arrow keys, button pan
plus `scripts/test-phase-04.sh` (see Manual Test Script below).

## Manual Test Script (mandatory, every phase)
Write `scripts/test-phase-04.sh`, executable, that builds/runs what this
phase just produced so the result can be checked by hand — no manual setup
steps beyond running the script. Build and run the container (per
architecture §5 / CLAUDE.md build commands: `docker compose up -d` or
`npm ci && npm run dev -- --host` when Docker is unavailable), wait until
it is serving, then print the URL to open in a browser
(`http://localhost:5173`). Script must `set -e`, fail loudly
on error, and leave the environment in a state where the printed URL/path
is immediately checkable — don't just echo instructions, actually do the
build/run.

The script must end by printing a **Manual Checklist** as a
`cat <<'EOF' ... EOF` block with exactly these items (add more if the
implementation surfaced extra states, never fewer):
```
Manual Checklist — Phase 04 Timeline
[ ] Mouse wheel over timeline scrolls it sideways, page does not scroll
[ ] Drag timeline pans; a short click still sets the year
[ ] ◀ ▶ move ~60% of a screen; + − zoom; − at minimum shows all 4,000 years
[ ] At default zoom no two cards fully overlap; crowded Qin shows a '+N' card that opens a list
[ ] Left/Right arrow keys move the playhead 25 years; Tab reaches cards, Enter opens
[ ] Era band under the playhead is outlined
[ ] Scrolling 150 fixture events stays smooth (no visible jank)
```

## Validation Verification
**Never report this phase done from implementation alone. Report done from
evidence. Anything you could not verify must be explicitly marked
UNPROVEN.** Prove it:
1. State which requirement was actually implemented — not what you assume
   was wanted. Quote the spec line (PRD/architecture/storyboard) it
   satisfies.
2. Run the test that proves the requested behavior works — actually
   execute it, don't describe what running it would show.

Before closing this phase, in order:
1. Run `/ponytail-review` on this phase's diff and resolve everything it
   flags (delete over-built code, simplify where the ladder says so).
2. Reviewer subagent sign-off (Multi-Agent Execution step 4).
3. Run `scripts/test-phase-04.sh` yourself to confirm it works, then tell
   the user to run it too and report what to check (URL to open / file to
   inspect, and the Manual Checklist items), plus the exact automated test
   command to run (`npm test`, and `npm run e2e` where this phase adds e2e).

Are you clear on these instructions? Please ask any clarifying questions
before we begin.
