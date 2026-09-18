# Graph Report - src/ (+ architecture.md, mockup.html)  (2026-09-18)

## Corpus Check
- 15 files · ~15,607 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 152 nodes · 242 edges · 19 communities detected
- Extraction: 74% EXTRACTED · 26% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Architecture Spec vs Mockup (view modules)|Architecture Spec vs Mockup (view modules)]]
- [[_COMMUNITY_Architecture Spec Data Pipeline & Build|Architecture Spec: Data Pipeline & Build]]
- [[_COMMUNITY_DOM Helpers + Static Views (aboutexplorelandingsearch)|DOM Helpers + Static Views (about/explore/landing/search)]]
- [[_COMMUNITY_Mock Data + Map View|Mock Data + Map View]]
- [[_COMMUNITY_State Store + Detail View|State Store + Detail View]]
- [[_COMMUNITY_State Store + Timeline View|State Store + Timeline View]]
- [[_COMMUNITY_Tour View|Tour View]]
- [[_COMMUNITY_Router|Router]]
- [[_COMMUNITY_Architecture Spec Screen Routing|Architecture Spec: Screen Routing]]
- [[_COMMUNITY_Architecture Spec Observability|Architecture Spec: Observability]]
- [[_COMMUNITY_Mockup Timeline Prototype Functions|Mockup Timeline Prototype Functions]]
- [[_COMMUNITY_Architecture Spec Tech Stack Rationale|Architecture Spec: Tech Stack Rationale]]
- [[_COMMUNITY_Architecture Spec Build Order|Architecture Spec: Build Order]]
- [[_COMMUNITY_Mockup Category Definitions|Mockup Category Definitions]]
- [[_COMMUNITY_Architecture Spec System Topology|Architecture Spec: System Topology]]
- [[_COMMUNITY_Architecture Spec TourStop Model|Architecture Spec: TourStop Model]]
- [[_COMMUNITY_Architecture Spec MapShape Model|Architecture Spec: MapShape Model]]
- [[_COMMUNITY_Architecture Spec WorldContext Model|Architecture Spec: WorldContext Model]]
- [[_COMMUNITY_Architecture Spec Runtime State Shape|Architecture Spec: Runtime State Shape]]

## God Nodes (most connected - your core abstractions)
1. `get()` - 14 edges
2. `el()` - 12 edges
3. `data.js — loads content JSON, indexes` - 12 edges
4. `set()` - 10 edges
5. `render()` - 9 edges
6. `subscribe()` - 8 edges
7. `render()` - 8 edges
8. `scripts/fetch-images.mjs — image fetch/convert pipeline` - 8 edges
9. `render()` - 7 edges
10. `state.js — single store + URL hash sync` - 7 edges

## Surprising Connections (you probably didn't know these)
- `EVENTS = [...] (inline mock event data)` --semantically_similar_to--> `content/events.json`  [INFERRED] [semantically similar]
  mockup.html → architecture.md
- `ERAS = [...] (inline mock era data)` --semantically_similar_to--> `content/eras.json`  [INFERRED] [semantically similar]
  mockup.html → architecture.md
- `function renderTimeline()` --semantically_similar_to--> `timeline.js — DOM timeline, zoom, drag, playhead`  [INFERRED] [semantically similar]
  mockup.html → architecture.md
- `function morphTo() — territory shape morph` --semantically_similar_to--> `map.js — inline SVG, morph, pins`  [INFERRED] [semantically similar]
  mockup.html → architecture.md
- `function openEvent()` --semantically_similar_to--> `detail.js — event panel, focus trap`  [INFERRED] [semantically similar]
  mockup.html → architecture.md

## Hyperedges (group relationships)
- **Playhead-driven time synchronization across timeline, map, and world strip** — architecture_statejs, architecture_timelinejs, architecture_mapjs, prd_f7meanwhile [INFERRED 0.80]
- **Content-to-image build pipeline (validate, fetch, license-check, manifest)** — architecture_validatemjs, architecture_fetchimagesmjs, architecture_licensesallowlist, architecture_fetchimagesallowlist, architecture_imagesmanifestjson [EXTRACTED 0.90]

## Communities

### Community 0 - "Architecture Spec vs Mockup (view modules)"
Cohesion: 0.08
Nodes (29): data.js — loads content JSON, indexes, detail.js — event panel, focus trap, content/eras.json, Rationale: Inline SVG map (morphable polygons, no map library), map.js — inline SVG, morph, pins, content/map-shapes.json, search.js — filter chips + search box, state.js — single store + URL hash sync (+21 more)

### Community 1 - "Architecture Spec: Data Pipeline & Build"
Cohesion: 0.1
Nodes (22): Rule: JSON strings rendered via textContent, never innerHTML, Content Security Policy meta tag, docker-compose.yml (web service, node:20-alpine), Era data model (eras.json), Event data model (events.json), content/events.json, scripts/fetch-images.allowlist.json (host allowlist), scripts/fetch-images.mjs — image fetch/convert pipeline (+14 more)

### Community 2 - "DOM Helpers + Static Views (about/explore/landing/search)"
Cohesion: 0.15
Nodes (9): mount(), el(), qs(), toast(), mount(), renderChips(), toggleCat(), mount() (+1 more)

### Community 3 - "Mock Data + Map View"
Cohesion: 0.27
Nodes (12): morphTo(), mount(), reduceMotion(), render(), renderPins(), svgEl(), catColor(), eraAt() (+4 more)

### Community 4 - "State Store + Detail View"
Cohesion: 0.33
Nodes (8): badge(), close(), mount(), open(), render(), defaultPxPerYear(), set(), subscribe()

### Community 5 - "State Store + Timeline View"
Cohesion: 0.53
Nodes (7): get(), installDrag(), mount(), pan(), render(), scrollToYear(), zoom()

### Community 6 - "Tour View"
Cohesion: 0.57
Nodes (6): end(), gotoStop(), mount(), render(), start(), step()

### Community 7 - "Router"
Cohesion: 0.7
Nodes (3): go(), mount(), render()

### Community 8 - "Architecture Spec: Screen Routing"
Cohesion: 0.4
Nodes (5): router.js — landing/explore/about routing, #about section, #explore section, function go() — screen navigation, #landing section

### Community 9 - "Architecture Spec: Observability"
Cohesion: 0.5
Nodes (4): diag.js — error/image-fail logging, Lighthouse CI performance budget (perf>=90, a11y>=95, JS<=150KB), Observability Plan (diag.js, build logs, Plausible, Lighthouse CI), Plausible analytics (VITE_ANALYTICS flag)

### Community 10 - "Mockup Timeline Prototype Functions"
Cohesion: 0.67
Nodes (1): #tl / #tlScroll timeline elements

### Community 11 - "Architecture Spec: Tech Stack Rationale"
Cohesion: 0.67
Nodes (3): Rationale: No TypeScript (JSDoc instead, revisit at ~3k lines), Tech Stack decisions table, Rationale: Vanilla JS, no framework (150 events small, saves 40KB)

### Community 12 - "Architecture Spec: Build Order"
Cohesion: 1.0
Nodes (2): Build order for phases (state+data first, then timeline/map, then detail/search/tour), Dependency Graph (runtime/build/tests)

### Community 15 - "Mockup Category Definitions"
Cohesion: 1.0
Nodes (1): CATS = [...] (category definitions)

### Community 17 - "Architecture Spec: System Topology"
Cohesion: 1.0
Nodes (1): System Topology (build-time vs runtime)

### Community 18 - "Architecture Spec: TourStop Model"
Cohesion: 1.0
Nodes (1): TourStop data model (tour.json)

### Community 19 - "Architecture Spec: MapShape Model"
Cohesion: 1.0
Nodes (1): MapShape data model (map-shapes.json)

### Community 20 - "Architecture Spec: WorldContext Model"
Cohesion: 1.0
Nodes (1): WorldContext data model (world.json)

### Community 21 - "Architecture Spec: Runtime State Shape"
Cohesion: 1.0
Nodes (1): Runtime state shape {screen, year, eventId, cats, tourIdx, pxPerYear}

## Knowledge Gaps
- **33 isolated node(s):** `@font-face Fredoka (self-hosted, base64 embedded WOFF2)`, `CATS = [...] (category definitions)`, `#landing section`, `#explore section`, `#about section` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Mockup Timeline Prototype Functions`** (3 nodes): `function panTl()`, `#tl / #tlScroll timeline elements`, `function zoom()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Architecture Spec: Build Order`** (2 nodes): `Build order for phases (state+data first, then timeline/map, then detail/search/tour)`, `Dependency Graph (runtime/build/tests)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mockup Category Definitions`** (1 nodes): `CATS = [...] (category definitions)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Architecture Spec: System Topology`** (1 nodes): `System Topology (build-time vs runtime)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Architecture Spec: TourStop Model`** (1 nodes): `TourStop data model (tour.json)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Architecture Spec: MapShape Model`** (1 nodes): `MapShape data model (map-shapes.json)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Architecture Spec: WorldContext Model`** (1 nodes): `WorldContext data model (world.json)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Architecture Spec: Runtime State Shape`** (1 nodes): `Runtime state shape {screen, year, eventId, cats, tourIdx, pxPerYear}`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `el()` connect `DOM Helpers + Static Views (about/explore/landing/search)` to `Mock Data + Map View`, `State Store + Detail View`, `State Store + Timeline View`, `Tour View`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `data.js — loads content JSON, indexes` connect `Architecture Spec vs Mockup (view modules)` to `Architecture Spec: Data Pipeline & Build`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `get()` (e.g. with `go()` and `render()`) actually correct?**
  _`get()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `el()` (e.g. with `badge()` and `mount()`) actually correct?**
  _`el()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `set()` (e.g. with `go()` and `open()`) actually correct?**
  _`set()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `render()` (e.g. with `get()` and `eraAt()`) actually correct?**
  _`render()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@font-face Fredoka (self-hosted, base64 embedded WOFF2)`, `CATS = [...] (category definitions)`, `#landing section` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._