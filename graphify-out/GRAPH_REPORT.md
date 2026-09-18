# Graph Report - src  (2026-09-18)

## Corpus Check
- Corpus is ~7,047 words - fits in a single context window. You may not need a graph.

## Summary
- 89 nodes · 165 edges · 8 communities detected
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `get()` - 15 edges
2. `el()` - 12 edges
3. `render()` - 12 edges
4. `set()` - 11 edges
5. `subscribe()` - 7 edges
6. `render()` - 7 edges
7. `render()` - 7 edges
8. `layoutFull()` - 7 edges
9. `fmtYear()` - 6 edges
10. `mount()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `zoom()` --calls--> `clampPxPerYear()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/timeline.js → /home/jthe/Dev/localgit/chinese_history/src/state.js
- `render()` --calls--> `icon()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/detail.js → /home/jthe/Dev/localgit/chinese_history/src/icons.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/search.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/tour.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/map.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (16): mount(), badge(), diag(), imageFor(), mount(), neighbors(), notFound(), open() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.2
Nodes (12): eraAt(), applyZoom(), morphTo(), mount(), reduceMotion(), render(), renderPins(), spreadPins() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.23
Nodes (11): eventsIn(), assignLanes(), installDrag(), laneCount(), layoutFull(), mount(), render(), scrollToYear() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (9): mount(), renderChips(), toggleCat(), go(), mount(), render(), get(), subscribe() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (9): close(), clampPxPerYear(), defaultPxPerYear(), defaults(), fromHash(), parseCatsList(), set(), toHash() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (2): fmtYear(), render()

### Community 6 - "Community 6"
Cohesion: 0.7
Nodes (4): end(), gotoStop(), start(), step()

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (2): icon(), svgEl()

## Knowledge Gaps
- **Thin community `Community 5`** (7 nodes): `catColor()`, `fetchRead()`, `fmtYear()`, `data.js`, `load()`, `search()`, `render()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (3 nodes): `icon()`, `icons.js`, `svgEl()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.317) - this node is a cross-community bridge._
- **Why does `el()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `render()` connect `Community 0` to `Community 3`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.233) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `get()` (e.g. with `go()` and `render()`) actually correct?**
  _`get()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `el()` (e.g. with `badge()` and `mount()`) actually correct?**
  _`el()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `render()` (e.g. with `get()` and `el()`) actually correct?**
  _`render()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `set()` (e.g. with `go()` and `notFound()`) actually correct?**
  _`set()` has 8 INFERRED edges - model-reasoned connections that need verification._