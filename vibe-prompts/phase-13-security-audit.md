# Phase 13 — Security audit · Middle Kingdom Explorer

> Run in a fresh Claude Code session (or /clear) with PRD.md,
> architecture.md, storyboard.md, and CLAUDE.md in the workspace. Read
> CLAUDE.md first, enter plan mode before implementing, and verify ponytail
> is active. Portable: outside Claude Code, load and run this prompt via
> Caveman.

## Context Initialization
This session builds exactly the following, and nothing else:
- Execute — not describe — the audit below against the built site and the build scripts, fix what fails, and record evidence in `docs/security-audit.md`
Reference: architecture.md §7 Security Posture; PRD.md §8 Security; all previous phases.

## Scope Boundary
- In scope:
  - Audit, fixes, headers config for GitHub Pages (meta CSP; document that Pages cannot set HTTP headers and what a Netlify/Cloudflare `_headers` file would add)
- Out of scope — do NOT touch:
  - New features

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
- `docs/security-audit.md` with each vector, the command run, the result, and the fix commit
- Fixes in `src/`, `scripts/`, `index.html`, CI
- Riskiest flows (this project has no auth; substitute these): (1) content injection via JSON strings — try `<img onerror>` and `javascript:` URLs in title/body/credit/related and confirm rendered as text; (2) deep-link abuse — `#event=<script>`, 10 KB hash, malformed cats; (3) localStorage tampering — garbage and huge values for tourIdx/cats; (4) build scripts — SSRF via `url` source pointing at `http://169.254.169.254`, `file://`, redirect to a non-allowlisted host, oversized response, wrong Content-Type, path traversal in event ids used as filenames; (5) supply chain — `npm audit --omit=dev` must be empty (zero runtime deps), lockfile committed, CI pins action SHAs
- Rate limiting: not applicable at runtime (static host); verify build-script throttle (1 req/s) and User-Agent are enforced in code and tests; CAPTCHA/CORS: no forms and no API — state this explicitly with evidence
- Zero-trust checks: `.env` never bundled (grep `dist/` for FETCH_USER_AGENT and any secret-looking strings), no over-fetching (only the six JSON files load), no stack traces to users (diag logs to console only), CSP meta present and effective (inject an inline script in DevTools → blocked), no API keys anywhere (none are needed)
- Run the three audit prompts against the codebase and act on findings: (1) "Review my app as a security specialist and ensure I have strong security headers and a solid baseline security posture." (2) "Review my app against OWASP standards and highlight vulnerabilities, specifically looking for SQL injection, XSS, and authentication flaws." (3) "Check my app for credential or sensitive data leaks in frontend components or API routes."
- Close with: do not deploy to production until every vector above passes.
plus `scripts/test-phase-13.sh` (see Manual Test Script below).

## Manual Test Script (mandatory, every phase)
Write `scripts/test-phase-13.sh`, executable, that builds/runs what this
phase just produced so the result can be checked by hand — no manual setup
steps beyond running the script. Build and run the container (per
architecture §5 / CLAUDE.md build commands: `docker compose up -d` or
`npm ci && npm run dev -- --host` when Docker is unavailable), wait until
it is serving, then print the URL to open in a browser
(`http://localhost:5173`). Also run `npm audit --omit=dev`, the injection e2e, and print the audit doc path before the URL. Script must `set -e`, fail loudly
on error, and leave the environment in a state where the printed URL/path
is immediately checkable — don't just echo instructions, actually do the
build/run.

The script must end by printing a **Manual Checklist** as a
`cat <<'EOF' ... EOF` block with exactly these items (add more if the
implementation surfaced extra states, never fewer):
```
Manual Checklist — Phase 13 Security audit
[ ] docs/security-audit.md lists every vector with command + result
[ ] Injection fixtures render as literal text in card, detail, About credits
[ ] #event=<script>alert(1)</script> → not-found toast, nothing executed
[ ] DevTools: inline script injection blocked by CSP
[ ] `npm audit --omit=dev` → 0 vulnerabilities, 0 runtime deps
[ ] fetch-images with url=http://169.254.169.254/ → rejected (host not allowlisted) before any request
[ ] grep dist/ for env values → nothing
[ ] Deploy checklist in the doc is fully ticked before merging to main
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
3. Run `scripts/test-phase-13.sh` yourself to confirm it works, then tell
   the user to run it too and report what to check (URL to open / file to
   inspect, and the Manual Checklist items), plus the exact automated test
   command to run (`npm test`, and `npm run e2e` where this phase adds e2e).

Are you clear on these instructions? Please ask any clarifying questions
before we begin.
