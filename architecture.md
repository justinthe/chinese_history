# Architecture — Middle Kingdom Explorer

Static single-page site. No backend, no accounts, no runtime third-party calls. All complexity lives at build time (content validation, image fetching) so the shipped site is HTML + one JS bundle + one CSS file + JSON + images.

## 1. System Topology

```
 BUILD TIME (developer laptop / GitHub Actions)
 ┌─────────────────────────────────────────────────────────────────────┐
 │ content/                                                            │
 │   events.json  eras.json  tour.json  map-shapes.json  world.json    │
 │        │                                                            │
 │        ▼                                                            │
 │  scripts/validate.mjs ──fail──▶ exit 1 (CI blocks)                  │
 │        │ ok                                                         │
 │        ▼                                                            │
 │  scripts/fetch-images.mjs ──HTTPS──▶ commons.wikimedia.org (API)    │
 │        │                    ──HTTPS──▶ collectionapi.metmuseum.org  │
 │        │                    ──HTTPS──▶ direct URLs (allowlist)      │
 │        ▼                                                            │
 │  public/img/{id}-card.webp, {id}-detail.webp                        │
 │  content/images.manifest.json  (credit, license, source, hash)      │
 │        │                                                            │
 │        ▼                                                            │
 │  vite build ──▶ dist/  ──▶ GitHub Pages                             │
 └─────────────────────────────────────────────────────────────────────┘

 RUNTIME (browser)
 ┌──────────────────────────────────────────────────────────────┐
 │ index.html                                                   │
 │  ├─ app.js (ES module bundle)                                │
 │  │    ├─ state.js      ── single store + URL hash sync       │
 │  │    ├─ data.js       ── loads /content/*.json, indexes     │
 │  │    ├─ router.js     ── landing | explore | about          │
 │  │    ├─ timeline.js   ── DOM timeline, zoom, drag, playhead │
 │  │    ├─ map.js        ── inline SVG, morph, pins            │
 │  │    ├─ detail.js     ── event panel, focus trap            │
 │  │    ├─ tour.js       ── docked tour panel                  │
 │  │    ├─ search.js     ── filter chips + search box          │
 │  │    └─ diag.js       ── error/image-fail logging           │
 │  ├─ styles.css                                               │
 │  ├─ /content/*.json  (fetched once, cached by SW-less HTTP)  │
 │  └─ /img/*.webp      (lazy)                                  │
 │ localStorage: tourStop, filters                              │
 └──────────────────────────────────────────────────────────────┘
```

Data flow at runtime: `data.js` loads JSON → `state.js` holds `{year, eraId, eventId, cats, tourIdx, screen}` → every view module subscribes and re-renders its own DOM → user actions call state setters → state writes URL hash. No view talks to another view directly.

## 2. Tech Stack

| Choice | Rationale |
|---|---|
| Vanilla JS (ES2022 modules), no framework | Mockup is already vanilla and works. 150 events is small. A framework adds 40+ KB and a build concept for no gain. |
| Vite | Zero-config dev server with HMR, one-command production bundle, handles JSON and asset hashing. |
| Plain CSS with custom properties | Design tokens from mockup carry over unchanged. No preprocessor needed. |
| Inline SVG for map | Morphable polygons via attribute tweening; no map library, no tiles. |
| Node 20 scripts (`.mjs`) for build tooling | Same runtime as Vite, no second language. |
| `sharp` (dev dependency) | Resize and convert fetched images to WebP at two sizes. Only battle-tested option. |
| Vitest | Unit tests for pure modules (state, data indexing, validate rules, license allowlist). Ships with Vite. |
| Playwright | Smoke e2e: landing → explore → open event → tour. Also used by the pipeline's screenshot script. |
| GitHub Actions + GitHub Pages | Free static hosting; CI runs validate + tests + build on every push. |
| No TypeScript | JSDoc types on the data models give editor help without a compile step. Revisit if the codebase passes ~3k lines. |

Fonts: self-hosted WOFF2 subsets of Fredoka and Nunito in `public/fonts/` (the mockup's Google Fonts link is replaced; CSP forbids third-party origins).

## 3. Data Models

All content is JSON under `content/`. Negative year = BCE. Ids are kebab-case, unique across the file.

### Era (`eras.json`, array)
| Field | Type | Notes |
|---|---|---|
| id | string | e.g. `qin` |
| name | string | Display name |
| hanzi | string | |
| start | int | Year, inclusive |
| end | int | Year, exclusive. Last era uses `null` = build year |
| color | string | Hex |
| capital | string | Display text, may include arrows for moves |
| capitalXY | [number, number] | SVG viewBox coords |
| shape | string | Key into `map-shapes.json` |
| oneLiner | string | ≤ 90 chars |
| legendary | bool | Optional, default false |

### Event (`events.json`, array)
| Field | Type | Notes |
|---|---|---|
| id | string | |
| title | string | ≤ 60 chars |
| hanzi | string | |
| pinyin | string | With tone marks |
| year | int | |
| yearEnd | int \| null | For spans |
| era | string | Era id; year must fall within era range (validate) |
| category | enum | `dynasty` \| `war` \| `tech` \| `nature` \| `people` \| `other` |
| icon | string | Emoji or icon key from the SVG set |
| summary | string | ≤ 160 chars, card text |
| body | string[] | 2–3 paragraphs |
| whyItMatters | string | |
| xy | [number, number] | Pin position in SVG viewBox |
| related | string[] | Event ids; validated |
| legendary | bool | Optional |
| image | ImageSource \| null | See below |

### ImageSource (embedded in Event)
Exactly one of:
```json
{ "commons": "File:Terracotta Army Pit 1 - 2.jpg" }
{ "met": 42179 }
{ "url": "https://example.org/x.jpg", "license": "CC BY 4.0", "credit": "Name, source", "licenseUrl": "https://..." }
```
Optional in all forms: `"alt": "..."`, `"focus": "center" | "top" | "bottom"` (crop hint). `url` form requires explicit `license` and `credit`; the host must be in `scripts/fetch-images.allowlist.json`.

AI illustrations: file dropped in `content/img-src/{id}.png` with an entry `{ "local": "img-src/{id}.png", "license": "Illustration", "credit": "AI illustration, reviewed YYYY-MM-DD" }`.

### ImageManifest (`content/images.manifest.json`, generated, committed)
```json
{
  "terracotta": {
    "card": "img/terracotta-card.webp",
    "detail": "img/terracotta-detail.webp",
    "alt": "Rows of terracotta soldiers in Pit 1",
    "credit": "Photo: Maros Mraz, Wikimedia Commons",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:...",
    "sourceHash": "sha256:...",
    "fetchedAt": "2026-09-18"
  }
}
```
Keyed by event id. `sourceHash` is the hash of the ImageSource object; fetch skips entries whose hash matches (idempotent).

### TourStop (`tour.json`, array, ordered)
| Field | Type |
|---|---|
| event | string (event id) |
| title | string |
| text | string, 3–4 sentences |

### MapShape (`map-shapes.json`, object)
Key → array of 16 numbers (8 points, x,y). All shapes share point count and winding order so any pair can be tweened. `land`, `korea`, `japan`, `rivers` are fixed background paths (SVG `d` strings).

### WorldContext (`world.json`, object)
Era id → string, "Meanwhile in the world" line.

### Runtime state (`state.js`)
```js
{ screen: 'landing'|'explore'|'about', year: int, eventId: string|null,
  cats: Set<Category>, tourIdx: int|-1, pxPerYear: number }
```
URL hash mirrors `screen`, `year`, `eventId`, `cats`. `tourIdx` and `cats` also persist to localStorage.

## 4. API Boundaries

### Runtime: none
The site makes no network calls beyond loading its own static files. No endpoints exist.

### Internal module interfaces (the contract between files)
| Module | Exports | Consumes |
|---|---|---|
| `state.js` | `get()`, `set(patch)`, `subscribe(fn)`, `fromHash()`, `toHash()` | — |
| `data.js` | `load()` → `{eras, events, tour, shapes, world, images}`, `eraAt(year)`, `eventsIn(eraId, cats)`, `search(q)` | fetch of `/content/*.json` |
| `router.js` | `mount(root)` | state, all views |
| `timeline.js` | `mount(el)`, `scrollToYear(y)`, `zoom(f)`, `pan(dir)` | state, data |
| `map.js` | `mount(el)`, `morphTo(shapeKey, color)` | state, data |
| `detail.js` | `mount(el)`, `open(eventId)`, `close()` | state, data |
| `tour.js` | `mount(el)`, `start()`, `step(d)`, `end()` | state, data, detail |
| `search.js` | `mount(el)` | state, data |
| `diag.js` | `install()` | window error events |

### Build-time external APIs (used only by `scripts/fetch-images.mjs`)
| Source | Call | Auth | Notes |
|---|---|---|---|
| Wikimedia Commons | `GET https://commons.wikimedia.org/w/api.php?action=query&titles=File:{name}&prop=imageinfo&iiprop=url\|extmetadata\|sha1&iiurlwidth=1600&format=json` | None | Must send descriptive `User-Agent` with contact URL per Wikimedia policy. License read from `extmetadata.LicenseShortName`, credit from `Artist` + `Credit`. Max 1 request/s. |
| Met Museum Open Access | `GET https://collectionapi.metmuseum.org/public/collection/v1/objects/{id}` | None | Only accept when `isPublicDomain: true`. Use `primaryImage`. Credit from `artistDisplayName` + `creditLine`. Max 1 request/s (their stated limit is 80/s; stay polite). |
| Direct URL | `GET {url}` | None | Host must be in `fetch-images.allowlist.json`. License and credit supplied in the ImageSource. |

License allowlist (`scripts/licenses.allowlist.json`): `Public domain`, `PD-old`, `PD-US`, `CC0`, `CC BY 2.0/3.0/4.0`, `CC BY-SA 2.0/3.0/4.0`. Anything else (including `CC BY-NC`, `CC BY-ND`, fair use) is rejected with a line in the report. CC BY-SA images require the About page to carry the SA notice; validate checks this once any BY-SA image exists.

Fetch script CLI:
```
node scripts/fetch-images.mjs [--only <eventId>] [--force] [--dry-run]
```
Output: images written to `public/img/`, manifest updated, summary table (fetched / skipped-unchanged / rejected-license / failed-network) printed, exit 1 on any rejection or failure unless `--allow-missing`.

## 5. Containerization & Environments

Static site; a container is only for a reproducible toolchain.

```yaml
# docker-compose.yml
services:
  web:
    image: node:20-alpine
    working_dir: /app
    volumes: [".:/app"]
    command: sh -c "npm ci && npm run dev -- --host"
    ports: ["5173:5173"]
    environment:
      - FETCH_USER_AGENT=MiddleKingdomExplorer/0.1 (https://github.com/<owner>/<repo>; contact@example.com)
```

npm scripts:
| Script | Does |
|---|---|
| `dev` | `vite` |
| `build` | `node scripts/validate.mjs && vite build` |
| `validate` | Content schema and reference checks |
| `fetch-images` | Image pipeline (needs network; not run in `build`) |
| `test` | `vitest run` |
| `e2e` | `playwright test` against `vite preview` |
| `screens` | Pipeline screenshot script for storyboard images |

Environments: `local` (dev server), `ci` (GitHub Actions: validate, test, build, e2e on PR; deploy on main), `prod` (GitHub Pages). No env-specific config beyond the Plausible flag `VITE_ANALYTICS=1`.

## 6. Observability Plan

Pure frontend, no `/health` route.

- **Client diagnostics (`diag.js`).** `window.onerror` and `unhandledrejection` → `console.error` as structured JSON `{ts, sessionId, screen, year, eventId, msg, stack}`. `sessionId` is a random id per page load, in memory only. Image `onerror` logs `{ts, eventId, src}` and swaps in the category icon.
- **Build-time logs.** `validate.mjs` and `fetch-images.mjs` print one JSON line per problem plus a human summary; non-zero exit blocks CI. Fetch report also written to `content/images.report.json` for review.
- **Optional analytics.** Plausible script tag injected only when `VITE_ANALYTICS=1`; custom events `event_open`, `tour_start`, `tour_finish`, `search`. Not in v1 default.
- **Error tracking integration point.** `diag.js` exposes `setReporter(fn)`; Sentry or similar can be wired there later without touching views.
- **Performance budget in CI.** Lighthouse CI on `dist/`: perf ≥ 90, a11y ≥ 95, JS ≤ 150 KB gzipped.

## 7. Security Posture

No server, no user data, no secrets. Remaining surface:

- **Content Security Policy** (meta tag): `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'`. Plausible origin added only when the analytics flag is on.
- **No third-party runtime origins.** Fonts self-hosted, images self-hosted, JSON self-hosted.
- **Build scripts.** Only contact hosts in the allowlist. Send identifying `User-Agent`. Throttle to 1 request/s. Verify `Content-Type` is an image and size ≤ 20 MB before processing. Never execute or eval anything fetched. Manifest records source URL and hash for audit.
- **Content injection.** All JSON strings rendered via `textContent`, never `innerHTML`, except `body` paragraphs which are plain strings wrapped in `<p>` by code. No HTML allowed in content; validate rejects `<` in string fields.
- **localStorage.** Only `tourStop` (int) and `cats` (string list), parsed defensively.
- **Rate limiting / abuse.** Not applicable; static host handles it.
- **Dependencies.** `npm audit` in CI; dev-only dependencies (`sharp`, `vite`, `vitest`, `playwright`) never ship to the browser. Zero runtime npm dependencies.

## 8. Dependency Graph

```
Runtime
  main.js ─▶ router.js ─▶ { landing.js, explore.js, about.js }
  explore.js ─▶ { timeline.js, map.js, detail.js, tour.js, search.js }
  every view ─▶ state.js, data.js
  tour.js ─▶ detail.js (Read more)
  search.js ─▶ detail.js (open result)
  diag.js ─▶ (none; installed by main.js)
  data.js ─▶ /content/*.json, content/images.manifest.json

Build
  validate.mjs ─▶ content/*.json, scripts/licenses.allowlist.json
  fetch-images.mjs ─▶ content/events.json, scripts/licenses.allowlist.json,
                      scripts/fetch-images.allowlist.json, sharp
                   ─▶ writes public/img/*, content/images.manifest.json
  vite build ─▶ validate.mjs (pre-step), src/**, public/**, content/**

Tests
  vitest ─▶ state.js, data.js, validate rules, license allowlist matcher
  playwright ─▶ dist/ via vite preview
```

Build order for phases: `state` + `data` first (everything depends on them), then `timeline` and `map` (the core), then `detail`, `search`, `tour`, then content pipeline scripts, then content fill, then polish and CI.
