# Vibe Coding Prompts — Middle Kingdom Explorer

## One-time setup (Claude Code)
Install the ponytail plugin (two separate prompts):
    /plugin marketplace add DietrichGebert/ponytail
    /plugin install ponytail@ponytail
Ponytail level for this project: **ultra** (set with `/ponytail ultra`;
default full). It stays active across sessions and is injected into
subagents automatically.

Install the impeccable design skill:
    npx impeccable skills install
Run `/impeccable init` once, at the start of Phase 2, after the UI shell
exists. Every later UI-building phase closes with `/impeccable polish` on
the screens it touched (see that phase file's Visual Reference section).

Model switching: Opus while planning, Sonnet once the plan is accepted
(`/model opus` → `/model sonnet`), per vibe-pipeline-state.md.

## Running a phase
Fresh Claude Code session (or /clear), then:
    Read vibe-prompts/phase-NN-<name>.md and execute it.
(Outside Claude Code, load the same file via Caveman.)

Run the phases IN ORDER, one per fresh session.
Before each phase: read CLAUDE.md for current build/test commands and state.
Only advance when the previous phase's automated tests pass, its manual
testing steps have been verified, and /ponytail-review came back clean.

| # | File | Scope | Verify by |
|---|------|-------|-----------|
| 01 | phase-01-container-init.md | Container init — Vite dev server up in Docker, `npm test` green on a placeholder test | `scripts/test-phase-01.sh` |
| 02 | phase-02-ui-shell-mocks.md | UI shell with mocks — all 7 storyboard screens reachable on mock data | `scripts/test-phase-02.sh` |
| 03 | phase-03-state-and-data.md | State store, data loader, content schema — URL hash round-trips; validate.mjs rejects bad content | `scripts/test-phase-03.sh` |
| 04 | phase-04-timeline.md | Timeline — F2 acceptance criteria all green at 150-event scale | `scripts/test-phase-04.sh` |
| 05 | phase-05-map.md | Map — territory morphs per era, pins filter, reduced-motion respected | `scripts/test-phase-05.sh` |
| 06 | phase-06-event-detail.md | Event detail panel — F4 acceptance criteria; focus trap; image fallback | `scripts/test-phase-06.sh` |
| 07 | phase-07-search-filter-meanwhile.md | Search, category filter, Meanwhile strip — F6 and F7 acceptance criteria | `scripts/test-phase-07.sh` |
| 08 | phase-08-grand-tour.md | Grand Tour — F5 acceptance criteria; resume from localStorage | `scripts/test-phase-08.sh` |
| 09 | phase-09-image-pipeline.md | Build-time image pipeline — fetch-images.mjs populates manifest with credits; rejects non-allowlisted licenses | `scripts/test-phase-09.sh` |
| 10 | phase-10-content-fill.md | Content fill to v1 scope — validate passes at ≥ 150 events; coverage metrics met | `scripts/test-phase-10.sh` |
| 11 | phase-11-responsive-a11y-perf.md | Responsive, accessibility, performance pass — Lighthouse ≥ 90 perf / ≥ 95 a11y; axe clean; 360px usable | `scripts/test-phase-11.sh` |
| 12 | phase-12-observability.md | Observability — architecture §6 implemented: structured client diagnostics, build reports, analytics flag, reporter hook | `scripts/test-phase-12.sh` |
| 13 | phase-13-security-audit.md | Security audit — all vectors below executed with evidence; no deploy until green | `scripts/test-phase-13.sh` |

Phase order follows architecture.md §8: state + data first, then the two
core panes (timeline, map), then the panels that hang off them (detail,
search, tour), then the build-time content pipeline and the content itself,
then cross-cutting passes.

Context files every session needs available: PRD.md, architecture.md,
storyboard.md (with images/), CLAUDE.md.
