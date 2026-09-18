# Phase 11 — Responsive, accessibility, performance pass · Middle Kingdom Explorer

> Run in a fresh Claude Code session (or /clear) with PRD.md,
> architecture.md, storyboard.md, and CLAUDE.md in the workspace. Read
> CLAUDE.md first, enter plan mode before implementing, and verify ponytail
> is active. Portable: outside Claude Code, load and run this prompt via
> Caveman.

## Context Initialization
This session builds exactly the following, and nothing else:
- Mobile layouts finalized for all screens at 360–720 px (bottom sheets for detail and tour, chip row scrolls horizontally, legend hidden)
- Accessibility: axe-core e2e on every screen with zero violations; contrast ≥ 4.5:1 body / 3:1 large; every image alt; skip link; live region for toasts and year changes; full keyboard journey (storyboard Journey 1 and 2 with keyboard only)
- Performance: code-split nothing unless measured; lazy-load images; preload fonts; total JS ≤ 150 KB gzipped; FCP < 1.5 s on simulated broadband; Lighthouse CI in GitHub Actions with the PRD thresholds
- `prefers-reduced-motion` audit across timeline, map, panels
Reference: PRD.md §7 Lighthouse row, §8 Performance, Accessibility, Browsers; storyboard.md screen 7 and its known gap.

## Scope Boundary
- In scope:
  - Layout, a11y, perf fixes across existing modules; Lighthouse CI
- Out of scope — do NOT touch:
  - New features
  - Content edits

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
images/screen-07-explore-mobile.png as the baseline; the delivered mobile explore must be at least this and fix the map/tour squeeze. Desktop screens must still match images/screen-01…06.

If the impeccable skill is installed (00-README.md one-time setup), close
the phase by running `/impeccable polish <target>` on each screen this
phase touched and resolving what it flags, before Validation Verification —
real design craft feedback on the real UI code, not the throwaway mockup.
Skip this step entirely if impeccable isn't installed.

## Deliverables
- `e2e/a11y.spec.js` (axe on 7 screens), `e2e/keyboard.spec.js`
- `.github/workflows/ci.yml` gains Lighthouse CI with assertions perf ≥ 90, a11y ≥ 95, JS budget
- Fixes across `src/`
plus `scripts/test-phase-11.sh` (see Manual Test Script below).

## Manual Test Script (mandatory, every phase)
Write `scripts/test-phase-11.sh`, executable, that builds/runs what this
phase just produced so the result can be checked by hand — no manual setup
steps beyond running the script. Build and run the container (per
architecture §5 / CLAUDE.md build commands: `docker compose up -d` or
`npm ci && npm run dev -- --host` when Docker is unavailable), wait until
it is serving, then print the URL to open in a browser
(`http://localhost:5173`). Also run `npm run build` and print gzipped bundle sizes before the URL. Script must `set -e`, fail loudly
on error, and leave the environment in a state where the printed URL/path
is immediately checkable — don't just echo instructions, actually do the
build/run.

The script must end by printing a **Manual Checklist** as a
`cat <<'EOF' ... EOF` block with exactly these items (add more if the
implementation surfaced extra states, never fewer):
```
Manual Checklist — Phase 11 Responsive, accessibility, performance pass
[ ] 360px: every screen usable; detail and tour are bottom sheets; map ≥ 200px tall
[ ] Keyboard only: land → explore → open event → related → close → Grand Tour → finish
[ ] Screen reader announces year changes and toasts (VoiceOver/NVDA quick pass)
[ ] axe e2e: 0 violations
[ ] Lighthouse (DevTools, mobile): perf ≥ 90, a11y ≥ 95
[ ] Bundle: JS ≤ 150 KB gzipped
[ ] Reduced motion: no morph, no slide animations
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
3. Run `scripts/test-phase-11.sh` yourself to confirm it works, then tell
   the user to run it too and report what to check (URL to open / file to
   inspect, and the Manual Checklist items), plus the exact automated test
   command to run (`npm test`, and `npm run e2e` where this phase adds e2e).

Are you clear on these instructions? Please ask any clarifying questions
before we begin.
