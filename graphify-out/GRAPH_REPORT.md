# Graph Report - src/  (2026-09-18)

## Corpus Check
- Corpus is ~7,550 words - fits in a single context window. You may not need a graph.

## Summary
- 92 nodes · 165 edges · 9 communities detected
- Extraction: 67% EXTRACTED · 33% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 8|Community 8]]

## God Nodes (most connected - your core abstractions)
1. `get()` - 13 edges
2. `el()` - 12 edges
3. `render()` - 12 edges
4. `set()` - 10 edges
5. `subscribe()` - 7 edges
6. `render()` - 7 edges
7. `render()` - 7 edges
8. `layoutFull()` - 7 edges
9. `fmtYear()` - 6 edges
10. `mount()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `zoom()` --calls--> `clampPxPerYear()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/timeline.js → /home/jthe/Dev/localgit/chinese_history/src/state.js
- `morphTo()` --calls--> `tween()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/map.js → /home/jthe/Dev/localgit/chinese_history/src/lib/tween.js
- `render()` --calls--> `icon()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/detail.js → /home/jthe/Dev/localgit/chinese_history/src/icons.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/search.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/tour.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (16): mount(), badge(), diag(), imageFor(), mount(), neighbors(), notFound(), open() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (13): close(), go(), mount(), render(), clampPxPerYear(), defaultPxPerYear(), defaults(), fromHash() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.24
Nodes (11): fmtYear(), assignLanes(), installDrag(), laneCount(), layoutFull(), mount(), render(), scrollToYear() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (12): eraAt(), eventsIn(), applyZoom(), morphTo(), mount(), reduceMotion(), render(), renderPins() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (3): search(), fold(), parseYear()

### Community 5 - "Community 5"
Cohesion: 0.43
Nodes (7): end(), gotoStop(), mount(), render(), resumeIdx(), start(), step()

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (2): mount(), subscribe()

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (1): tween()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (2): icon(), svgEl()

## Knowledge Gaps
- **Thin community `Community 6`** (4 nodes): `mount()`, `nextCats()`, `subscribe()`, `search.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (4 nodes): `tween.js`, `easeOutCubic()`, `lerpPoints()`, `tween()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (3 nodes): `icon()`, `icons.js`, `svgEl()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.264) - this node is a cross-community bridge._
- **Why does `el()` connect `Community 0` to `Community 2`, `Community 3`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Why does `render()` connect `Community 0` to `Community 8`, `Community 1`, `Community 2`?**
  _High betweenness centrality (0.236) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `get()` (e.g. with `go()` and `render()`) actually correct?**
  _`get()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `el()` (e.g. with `badge()` and `mount()`) actually correct?**
  _`el()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `render()` (e.g. with `get()` and `el()`) actually correct?**
  _`render()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `set()` (e.g. with `go()` and `notFound()`) actually correct?**
  _`set()` has 7 INFERRED edges - model-reasoned connections that need verification._