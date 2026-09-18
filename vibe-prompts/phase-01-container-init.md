# Phase 01 — Container init · Middle Kingdom Explorer

> Run in a fresh Claude Code session (or /clear) with PRD.md,
> architecture.md, storyboard.md, and CLAUDE.md in the workspace. Read
> CLAUDE.md first, enter plan mode before implementing, and verify ponytail
> is active. Portable: outside Claude Code, load and run this prompt via
> Caveman.

## Context Initialization
This session builds exactly the following, and nothing else:
- Repo scaffold: Vite + vanilla JS ES modules, plain CSS, `content/`, `public/`, `src/`, `scripts/`
- `docker-compose.yml` with the node:20-alpine dev service (architecture §5)
- npm scripts: dev, build (validate placeholder + vite build), validate (placeholder that exits 0), test (vitest), e2e (playwright), screens
- Self-hosted Fredoka and Nunito WOFF2 in `public/fonts/` with `@font-face` (extract from the base64 blobs already in mockup.html)
- CSP meta tag per architecture §7 in `index.html`
- GitHub Actions workflow: on PR run validate + test + build; on main additionally deploy `dist/` to GitHub Pages
- `.gitignore`, `.nvmrc` (20), README stub
- One placeholder vitest test and one placeholder Playwright smoke test (page loads, title present) so the harness is proven
Reference: PRD.md §8 Non-Functional, architecture.md §2, §5, §7; storyboard.md (none built yet).

## Scope Boundary
- In scope:
  - Toolchain, folder layout, CI, fonts, CSP
  - Empty `index.html` that renders 'Middle Kingdom Explorer' in Fredoka on the paper background token
- Out of scope — do NOT touch:
  - Any screen, component, or content beyond the one-line index page
  - Image pipeline, validate rules, state store (later phases)
  - Analytics flag

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

## Deliverables
- `package.json`, `vite.config.js`, `docker-compose.yml`, `.github/workflows/ci.yml`
- `index.html`, `src/main.js`, `src/styles.css` with the design tokens from mockup.html `:root` copied verbatim
- `public/fonts/fredoka.woff2`, `public/fonts/nunito.woff2`
- `tests/smoke.test.js` (vitest), `e2e/smoke.spec.js` (playwright)
plus `scripts/test-phase-01.sh` (see Manual Test Script below).

## Manual Test Script (mandatory, every phase)
Write `scripts/test-phase-01.sh`, executable, that builds/runs what this
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
Manual Checklist — Phase 01 Container init
[ ] http://localhost:5173 loads with no console errors
[ ] Page title 'Middle Kingdom Explorer' rendered in Fredoka (check Network tab: font loaded from /fonts/, no requests to googleapis/gstatic)
[ ] Background is paper #fff7e8
[ ] `npm test` and `npm run e2e` both pass
[ ] CI workflow file lints (act or GitHub 'Actions' tab shows a run on push)
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
3. Run `scripts/test-phase-01.sh` yourself to confirm it works, then tell
   the user to run it too and report what to check (URL to open / file to
   inspect, and the Manual Checklist items), plus the exact automated test
   command to run (`npm test`, and `npm run e2e` where this phase adds e2e).

Are you clear on these instructions? Please ask any clarifying questions
before we begin.
