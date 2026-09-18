# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Curious English-speaking adults with no background in Chinese history, browsing on desktop first, responsive down to 360px. Three confirmed personas (PRD.md §3): Maya (34, product designer) wants the big picture and a visual anchor for dates after a documentary rabbit hole; Tom (52, retired engineer) is prepping a Beijing/Xi'an trip and needs names and context without a 600-page book; Priya (27, developer) wants a fun 10-minute browse she can share, on par with a Kurzgesagt-style explainer.

## Product Purpose

Middle Kingdom Explorer shows ~4,000 years of Chinese history — Xia to present — on one screen: a horizontal timeline linked to a morphing map, illustrated event cards, and a guided Grand Tour of ~20 stops. Success (PRD.md §7): median session ≥8 minutes, ≥40% of sessions open 5+ event details, ≥30% Grand Tour completion.

## Positioning

Chinese history is usually either dense encyclopedic text or a shallow listicle; neither lets a newcomer *see* the whole shape of 4,000 years at once or place one date in context without homework. This product's mechanism — one screen, one scrubbable timeline morphing one map, no reading required to get oriented — is what a Wikipedia rabbit hole or a history-book chapter can't offer.

## Operating Context

Static site, no backend, no accounts. Visitor arrives from a documentary, a trip-planning search, or a shared link; either free-explores the timeline+map or takes the Grand Tour; opens event cards for two-minute reads; shares a specific event via URL. Content authored as JSON by hand (PRD.md F8), images fetched once at build time from open-license sources (Wikimedia Commons, Met Museum) and committed — the live site never calls third-party APIs at runtime.

## Capabilities and Constraints

- ~150 events across 18 eras (Xia legendary → PRC today), 6 categories (Dynasty, Wars, Tech, Nature & Disasters, Famous Figures, Other), Grand Tour of ~20 stops.
- No quizzes/badges, no bilingual UI, no user accounts, no CMS, no geographically accurate map (PRD.md §4 Out of Scope).
- Modern sensitive events (Cultural Revolution, 1989, Taiwan) covered neutrally and factually, casualty ranges sourced, no editorial adjectives (PRD.md §8 Content guidelines).
- Perf: FCP <1.5s, 60fps timeline/map at 150 events, JS ≤150KB gzipped. A11y: WCAG 2.1 AA, full keyboard nav, `prefers-reduced-motion` honored. Min viewport 360px.
- Every displayed image carries a license + credit; only allowlisted licenses (PD, CC0, CC BY, CC BY-SA) ship.

## Brand Commitments

Name: "Middle Kingdom Explorer." Playful illustrated visual style (interview log, PRD.md §11) — not a sober reference-work look. Existing design tokens (see DESIGN.md once written): warm cream paper background, red/gold/jade palette, Fredoka display + Nunito body type, rounded cards with a hard drop-shadow ("comic panel" feel). `mockup.html` is the approved visual reference; ported faithfully into the real app in Phase 02, not redesigned.

## Evidence on Hand

- `PRD.md`, `architecture.md`, `storyboard.md` — full product/architecture/screen spec, interview log dated 2026-09-18.
- `mockup.html` — approved interactive mockup (source of truth for markup/CSS/interaction being ported).
- `images/screen-01..07-*.png` — approved screenshots of all 7 storyboard screens, used as the pixel reference for this phase's port.
- No real event content yet: `src/mock-data.js` (Phase 02) holds ~28 sample events / 14 eras lifted from the mockup for UI development; the full ~150-event content fill is Phase 10.

## Product Principles

1. Orientation before depth — the timeline+map view must convey "when/where" before any card is opened.
2. No homework required — every screen works with zero prior knowledge of Chinese history.
3. Content integrity over completeness — every image credited, every sensitive topic handled neutrally, rather than rushing content volume.
4. Static and self-contained — no runtime third-party calls, ever; all complexity lives at build time.
5. Playful but not childish — illustrated warmth in visuals, factual/neutral tone in body copy.

## Accessibility & Inclusion

WCAG 2.1 AA (PRD.md §8): keyboard-only navigation for timeline (arrow keys), cards, and pins; focus trapped in the detail panel; all images have alt text; category color never the sole signal (paired with icons); contrast ≥4.5:1 body / ≥3:1 large text; `prefers-reduced-motion` disables the map morph animation.
