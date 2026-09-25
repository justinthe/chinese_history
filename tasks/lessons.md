# Lessons

## Phase 02 (UI shell with mocks)

**Measure layout only after paint, never in the same synchronous pass as append.**
`timeline.js`'s initial `scrollToYear()` call read `tlScrollEl.clientWidth` immediately
after appending the element — still 0, since the browser hadn't laid it out yet — so the
timeline silently opened scrolled to the wrong year on every first mount. Caught only by
actually opening the app in a browser and looking, not by unit/e2e tests (Playwright's
`waitFor` machinery and the `wait` steps between actions happened to mask it in the
automated suite). **Rule: any DOM measurement (`clientWidth`, `getBoundingClientRect`, …)
taken right after an element is created/appended must be deferred to
`requestAnimationFrame` (or a later tick), never read in the same synchronous block as the
`append()` call.** Automated tests are necessary but not sufficient for layout-timing bugs —
budget a real visual pass (screenshots or manual click-through) even when the suite is green.

**Every `mount()` that subscribes to shared state or adds a `window`/`document` listener
must return a cleanup, and the caller must call it before remounting.** Five of eight view
modules in this phase's router-swapped architecture (explore/timeline/map/tour/search) call
`state.subscribe()` or add global listeners inside `mount()`. Since the router replaces DOM
by calling `mount()` again on the next navigation rather than calling an explicit teardown,
skipping this pattern once means every later visit to that screen leaks a subscriber/listener
that keeps firing forever. Caught by re-reading the code with "what happens on the second
visit" in mind, not by the first read-through — a leak like this produces no failing test and
no visible symptom until a session has navigated back and forth enough times to matter.
**Rule: when a component-mount pattern is "swap the whole subtree, no unmount hook,"
`mount()` itself must return `() => { unsubscribe(); /* remove any window/document listeners */ }`,
and the direct caller must store and invoke the previous cleanup before the next mount.**

**Ported/inherited data or CSS can carry pre-existing "defects" that are actually intentional
or historically accurate — verify against the approved reference before "fixing."** Two mock
events (`redcliffs`, `revolution`) fall technically outside their era's year range by design
(historical nuance, not a data-entry slip); two CSS border patterns the detector flagged as
`side-tab`/`border-accent-on-rounded` were already reviewed and explicitly approved for
`mockup.html` in this same project's `.impeccable/config.json`. In both cases the fix was to
document/allowlist the exception with a cited reason, not to silently alter the ported
content or design to satisfy a new check — confirmed by loading the actual approved
`mockup.html` in a browser and comparing pixel-for-pixel before concluding "not a regression."

## Phase 04 (Timeline)

**An unconditional CSS `display` on a `[popover]` element defeats the browser's own
open/closed toggling — author styles always beat the UA stylesheet, regardless of
specificity.** `.more-list { display: flex; ... }` on the "+N more" popover made every
overflow list render permanently visible from first paint, well before any click — not a
crash, not a console error, not caught by `npm run e2e` (Playwright's real click on the chip
genuinely calls `showPopover()`, so `.more-list:popover-open` truly matched after the click
and the assertion passed regardless of the bug). Only surfaced by opening the app in a real
browser and looking at the very first screenshot before touching anything. **Rule: for any
`[popover]` element, never set layout-affecting CSS (`display`, or anything that would keep
it rendered) on the bare selector — scope it to `selector:popover-open` so the UA's closed-
state `display: none` survives. And when adding a native-platform interactive primitive
(`popover`, `<dialog>`, `<details>`), write the e2e assertion for its *closed* state before
its *open* state — a test that only checks "did it open" can't catch "it was already open."**

**A `position: absolute` toolbar floating over a scrollable region can collide with content
that scrolls under it — check the two elements' shared coordinate space, not just each one's
CSS in isolation.** `.tl-tools` (zoom/pan buttons) sits `position: absolute` inside
`.timeline`, at a fixed screen position; `.tl-inner`'s cards scroll underneath it. Nothing in
either rule looks wrong on its own, but lane 0 (`top: 4`) could land directly under the
tools' hot zone depending on scroll position, silently eating pointer events (`element
intercepts pointer events` in Playwright, no console error). Caught by an e2e test clicking a
card that happened to be positioned there — not by reading the CSS. **Rule: when a
floating/fixed-position control overlaps a scrollable content area, reserve its footprint in
the content's layout math (here, a `TOP_ZONE` constant subtracted from both the lane-count
and lane-position calculations) — don't rely on the two layers visually not colliding by
chance.**

**Phase 10 — a bulk-assign pass over "all records" must exclude records that already carry a
hand-curated value for that field.** The phase-10 content-merge script computed `xy` pin
coordinates for the ~127 new events via a golden-angle spread, then ran that same
`assign_xy()` over the *entire* merged array — including the 28 seed events that already had
deliberately hand-placed pin positions from earlier phases. It silently overwrote all 28,
detected only by diffing `git show HEAD:content/events.json` against the working tree before
committing, not by any test (nothing asserts specific `xy` values). **Rule: before running a
derived-field computation over a merged/bulk dataset, partition it first — recompute only the
rows that are actually new/missing the field, and diff hand-curated rows against their
pre-merge values before writing, don't assume "recompute for all" is safe just because the
function is pure.**

**Fiction layer — an author `display` rule silently defeats the `[hidden]` attribute.**
`detail.js` toggles `wikiEl.hidden` per event, but `.panel .wiki { display: inline-block }`
outranks the UA's `[hidden] { display: none }`, so the link never hid: a non-fiction card
opened after a fiction one showed the previous card's "Read the full story on Wikipedia ↗"
with no href. No unit test could see it; caught on self-review of the CSS diff, then proven by
an e2e test that failed without the fix. Same family as the phase-04 popover lesson. **Rule:
any element toggled with `hidden` must not get a `display` value from author CSS (or needs an
explicit `[hidden] { display: none }` override) — and the e2e test for it must go A→B across
two records in the reused panel, not just open B fresh.**
