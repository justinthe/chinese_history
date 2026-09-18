# PRD — Middle Kingdom Explorer

| | |
|---|---|
| Version | 0.2 (restructured to pipeline template, image sourcing added) |
| Date | 2026-09-18 |
| Owner | Justin The |
| Status | S1 baseline |

## Assumptions

Decisions the interview did not cover, made explicitly so they can be overturned at review:

- **A1.** No build-time CMS. Content lives in JSON files in the repo, edited by hand or script.
- **A2.** Images are fetched once at build time from open-license sources and committed to the repo. The live site never calls external image APIs.
- **A3.** Hosting on GitHub Pages. Any static host works.
- **A4.** Map is stylized (illustrated East Asia), not geographically accurate. Territory shapes are hand-drawn approximations, one per era.
- **A5.** Names use pinyin without tone marks in UI text; tone marks appear in the detail view pinyin line only.
- **A6.** No analytics in v1. A privacy-friendly counter (Plausible) can be added later without code changes beyond one script tag.
- **A7.** "Today" means the year of the build. Timeline end is computed, not hard-coded.

## 1. Overview

Middle Kingdom Explorer is a free static web app that shows all ~4,000 years of Chinese history on one screen: a horizontal timeline linked to a map whose borders morph as you travel through time. Curious adults with no background can scrub through dynasties, tap illustrated event cards for a two-minute read, and follow a guided Grand Tour of the twenty moments that matter most. Content covers government, wars, technology, natural disasters, famous figures and other big news, from the legendary Xia dynasty to the present, in plain English with a playful illustrated look.

## 2. Problem Statement

Chinese history is long, unfamiliar to most English speakers, and usually presented either as dense encyclopedic text or as shallow listicles. Newcomers cannot see the overall shape of the story, cannot place a name or date in context, and give up. There is no resource that lets a casual adult *see* 4,000 years at once and dip into any moment without homework.

## 3. User Personas

**Maya, 34, product designer, London.** Watched a documentary on the Terracotta Army, wants to know "what came before and after". Goals: get the big picture in one sitting, remember the dynasty order. Frustrations: Wikipedia rabbit holes, no visual anchor for dates.

**Tom, 52, retired engineer, Ohio.** Planning a first trip to Beijing and Xi'an. Goals: understand what he will see at the Forbidden City and the Great Wall, learn a few names to recognize. Frustrations: guidebooks assume knowledge, history books are 600 pages.

**Priya, 27, software developer, Bangalore.** Likes Kurzgesagt-style explainers, browses on laptop during lunch. Goals: ten fun minutes, something to share with friends. Frustrations: ugly educational sites, no way to link to a specific moment.

## 4. Scope

### In Scope (v1)

| Area | Decision |
|---|---|
| Time range | Xia (~2070 BCE, badged legendary) to present |
| Language | English. Pinyin names; hanzi shown as decoration in detail view |
| Content volume | ~150 events across all eras, ~10 per major dynasty |
| Categories | Dynasty/Government, Wars, Technology, Nature & Disasters, Famous Figures, Other big news |
| Depth | Card (title, year, 1–2 sentences, image) + expanded detail (2–3 paragraphs, "why it matters", related events) |
| Navigation | Horizontal scrolling timeline linked to morphing map, with playhead |
| Engagement | One Grand Tour of ~20 stops. No quizzes, no badges |
| Extras | Category filter chips, search by name or year, "Meanwhile in the world" strip |
| Modern era | Covered neutrally and factually, encyclopedic tone. Includes Cultural Revolution, 1989, Taiwan status |
| Images | Public-domain art and photos fetched from open collections at build time; custom SVG icon set and map; reviewed AI illustrations where no PD image fits |
| Platform | Desktop first, responsive down to 360px |
| Tech | Static site, no backend, no accounts. Content in JSON |

### Out of Scope (v1)

- User accounts, saved progress across devices
- Quizzes, badges, points, leaderboards
- Chinese-language UI or bilingual toggle
- Full-length articles, citations per sentence
- User-generated content, comments
- Multiple themed tours
- Geographically accurate map projection
- Runtime fetching of images or content from third parties
- CMS or admin UI

## 5. Core Features

### F1. Landing page
*As a first-time visitor I want a clear entry point so that I know what this is and how to start.*
- [ ] Hero with product name, one-line tagline, two buttons: Explore, Take the Grand Tour
- [ ] 3–4 teaser cards that deep-link to specific events
- [ ] Short "how to use" strip and About link
- [ ] Loads in under 2 s on broadband

### F2. Timeline
*As an explorer I want to scroll through 4,000 years so that I can see the shape of history at a glance.*
- [ ] Horizontal scroll: mouse wheel, click-drag, scrollbar, ◀ ▶ buttons, arrow keys
- [ ] Era bands colored per era, labeled when wide enough
- [ ] Event cards positioned at their year, colored by category, no two cards fully overlapping at default zoom
- [ ] Zoom in/out; default zoom makes the timeline ~2.5 screens wide; minimum zoom fits all
- [ ] Playhead marks current year; click anywhere sets it
- [ ] Current era band highlighted
- [ ] Year ticks with BCE/CE labels, density adapts to zoom

### F3. Map
*As an explorer I want to see where and how big China was at any moment so that dates have a place.*
- [ ] Stylized inline SVG map of East Asia
- [ ] Territory shape morphs (~600 ms) when the era changes
- [ ] Capital marker and era label with one-line description and capital name
- [ ] Event pins for events in the current era, icon by category; click opens detail
- [ ] Year badge always visible
- [ ] Respects `prefers-reduced-motion` (no morph animation)

### F4. Event detail
*As a reader I want a two-minute read on any event so that I understand what happened and why it matters.*
- [ ] Slide-in panel (desktop) or bottom sheet (mobile); timeline and map stay visible behind a scrim
- [ ] Image with credit line, title, hanzi + pinyin, year, category and era badges, Legend badge where applicable
- [ ] 2–3 paragraphs, "Why it matters" callout, related-event chips, prev/next within category
- [ ] Close by X, Esc, or clicking outside; focus trapped while open
- [ ] Opening an event updates the URL so it can be shared

### F5. Grand Tour
*As a newcomer I want a guided path through the highlights so that I do not have to choose where to start.*
- [ ] ~20 stops in chronological order, one per major era plus biggest turning points
- [ ] Docked narration panel beside the map (never covers it), with illustration, 3–4 sentences, Back / Next / Exit, progress dots
- [ ] Each stop moves the playhead, scrolls the timeline, morphs the map, highlights the event
- [ ] "Read more" opens the event detail without leaving the tour
- [ ] Resumes at last stop via localStorage; Exit drops into free explore at that year
- [ ] Finishing shows a completion message

### F6. Filter and search
*As an explorer I want to narrow the timeline to what I care about so that it is not overwhelming.*
- [ ] Six category chips, toggleable, at least one always on; timeline cards and map pins obey the filter
- [ ] Search box matches event title, hanzi, pinyin, or a year; results list of up to 6; selecting an event opens it, selecting a year moves the playhead
- [ ] Filter state persisted in URL

### F7. Meanwhile in the world
*As a reader I want to know what Rome or Europe was doing at the same time so that unfamiliar dates anchor to familiar ones.*
- [ ] One line per era, shown in a strip under the timeline, updates with the playhead

### F8. Content and image pipeline (build time)
*As the content author I want to add an event by editing JSON and get its image fetched and credited automatically so that 150 events do not take 300 hours.*
- [ ] Content lives in `content/events.json`, `content/eras.json`, `content/tour.json`, `content/map-shapes.json`
- [ ] A validation script fails the build on missing required fields, unknown era or category ids, dangling `related` ids, or events outside their era's date range
- [ ] Each event may declare an image source: a Wikimedia Commons file title, a Met Museum object id, or a direct URL with an explicit license
- [ ] A fetch script downloads each declared image once, verifies its license is in the allowlist (PD, CC0, CC BY, CC BY-SA), resizes to card and detail sizes, and writes an image manifest with credit and license text
- [ ] Images not in the allowlist are skipped with a report; the event falls back to its category icon
- [ ] The fetch script is idempotent: re-running downloads only new or changed sources
- [ ] Fetched images are committed to the repo; the site never fetches from third parties at runtime
- [ ] AI illustrations are placed manually in the source images folder with a credit line marking them as illustrations

### F9. About page
*As a reader I want to know who made this and how the content was sourced so that I can trust it.*
- [ ] Static page: purpose, scope, content guidelines, image sourcing policy, credits

## 6. User Flows

1. **First visit → explore.** Landing → Explore → Explore screen at default year (Qin, 221 BCE) → scroll timeline → click event card → Detail panel → click related chip → Detail updates → Esc → back to Explore.
2. **Grand Tour.** Landing → Take the Grand Tour → Explore screen with Tour panel at stop 1 → Next ×19 → Finish → completion toast → free explore.
3. **Search.** Explore → type "paper" → results → select → Detail panel for Cai Lun opens, timeline and map jump to 105 CE.
4. **Search by year.** Explore → type "1368" → "Jump to 1368 CE (Ming)" → playhead moves, map morphs to Ming.
5. **Filter.** Explore → toggle off all but Wars → timeline shows only war cards, map shows only war pins → toggle Tech back on.
6. **Map pin.** Explore → click a pin on the map → Detail panel opens for that event.
7. **Share.** Detail panel open → copy URL → open in new tab → same event and year restored.
8. **Mobile.** Landing on 375px wide → Explore → map above timeline, tour panel stacks under map, detail as bottom sheet.
9. **About.** Landing → About → About page → Back.
10. **Author adds an event (build time).** Edit `content/events.json` → run validate → run fetch-images → image and credit appear in manifest → build → event visible.

## 7. Success Metrics

| Metric | Target |
|---|---|
| Median session length | ≥ 8 minutes |
| Sessions that open ≥ 5 event details | ≥ 40% |
| Grand Tour completion rate (of starts) | ≥ 30% |
| Lighthouse performance / accessibility | ≥ 90 / ≥ 95 |
| Content coverage | ≥ 150 events, every era ≥ 5 events, every category ≥ 15 events |
| Images with valid credit | 100% of displayed images |

## 8. Non-Functional Requirements

**Performance.** First contentful paint under 1.5 s on broadband; timeline scroll and map morph at 60 fps with 150 events; images lazy-loaded; card images ≤ 40 KB, detail images ≤ 150 KB; total JS ≤ 150 KB gzipped.

**Accessibility.** WCAG 2.1 AA. Keyboard: arrow keys move playhead, Tab reaches cards and pins, Enter opens, Esc closes. All images have alt text. Focus trapped in detail panel. Color is never the only signal (icons accompany category colors). Contrast ≥ 4.5:1 body, ≥ 3:1 large text. `prefers-reduced-motion` honored.

**Content integrity.** Every displayed image has license and credit recorded in the manifest. Only allowlisted licenses ship. Legendary content badged. Modern sensitive events follow the content guidelines below.

**Security.** No backend, no user data, no cookies. localStorage only for tour progress and filter state. Content Security Policy meta tag: self-hosted assets only. Build scripts talk only to an allowlist of image API hosts and identify themselves with a User-Agent per those hosts' policies.

**Observability.** Client-side: unhandled errors and failed image loads logged to console with event id; optional Plausible script tag behind a build flag. Build-time: validate and fetch scripts print a summary and exit non-zero on failure so CI blocks a bad content commit.

**Browsers.** Last 2 versions of Chrome, Firefox, Safari, Edge. Min viewport 360 px.

**Content guidelines.** Plain English, no jargon, explain terms on first use. Every event answers "so what?". Dates as "214 BCE" / "1368 CE", approximate as "c.". Modern sensitive events: state what happened, give casualty ranges with source, avoid editorial adjectives, present where accounts differ. Fun tone in summaries, neutral in body.

## 9. Era List (v1)

Xia (legendary) · Shang · Western Zhou · Eastern Zhou (Spring & Autumn, Warring States) · Qin · Han · Three Kingdoms · Jin · Northern & Southern · Sui · Tang · Five Dynasties · Song (N & S) · Yuan · Ming · Qing · Republic (1912–49) · PRC (1949–today). Short disunity periods get thin bands and few events.

## 10. Open Questions

1. Who writes 150 events? Estimate ~1 h each with the image pipeline in place, ~150 h total.
2. AI illustration tool and style-lock method (reference image, prompt template).
3. Hong Kong / Macau handovers and Taiwan: separate pins or notes on existing events?
4. Domain name.

## 11. Interview Log (2026-09-18)

| Question | Answer |
|---|---|
| Audience | General curious adults |
| Language | English only |
| Core UX | Scrolling timeline + interactive map |
| Platform | Desktop first, mobile OK |
| Fun layer | Story mode / guided tour |
| Depth | Card summary + expand |
| Tech | Static site, no backend |
| Sensitive topics | Cover neutrally, factually |
| Visual style | Playful illustrated |
| Graphics | PD art, custom SVG, AI illustrations |
| Start | Xia ~2070 BCE, flagged legendary |
| Volume | ~150 events |
| Map | Borders morph + pins |
| Extras | Meanwhile in the world, category chips, search |
| Story | One Grand Tour, ~20 stops |
| Mockup | Landing, main, detail, story, about |
| Post-mockup | Timeline must scroll easily; tour panel must not cover map (docked beside it) |
