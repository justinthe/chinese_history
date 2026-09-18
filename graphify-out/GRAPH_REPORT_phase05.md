# Graph Report - src  (2026-09-18)

## Corpus Check
- Corpus is ~6,338 words - fits in a single context window. You may not need a graph.

## Summary
- 81 nodes · 152 edges · 8 communities detected
- Extraction: 64% EXTRACTED · 36% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.8)
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
2. `el()` - 11 edges
3. `set()` - 11 edges
4. `subscribe()` - 7 edges
5. `render()` - 7 edges
6. `render()` - 7 edges
7. `layoutFull()` - 7 edges
8. `fmtYear()` - 6 edges
9. `render()` - 6 edges
10. `mount()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `morphTo()` --calls--> `tween()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/map.js → /home/jthe/Dev/localgit/chinese_history/src/lib/tween.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/search.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/tour.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/map.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js
- `mount()` --calls--> `el()`  [INFERRED]
  /home/jthe/Dev/localgit/chinese_history/src/views/about.js → /home/jthe/Dev/localgit/chinese_history/src/dom.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (12): mount(), badge(), mount(), notFound(), open(), render(), el(), qs() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (14): close(), go(), mount(), render(), clampPxPerYear(), defaultPxPerYear(), defaults(), fromHash() (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.26
Nodes (10): fmtYear(), assignLanes(), installDrag(), laneCount(), layoutFull(), mount(), render(), scrollToYear() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.3
Nodes (11): eraAt(), applyZoom(), morphTo(), mount(), reduceMotion(), render(), renderPins(), spreadPins() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.39
Nodes (7): subscribe(), end(), gotoStop(), mount(), render(), start(), step()

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (1): eventsIn()

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (3): mount(), renderChips(), toggleCat()

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (1): tween()

## Knowledge Gaps
- **Thin community `Community 5`** (6 nodes): `catColor()`, `eventsIn()`, `fetchRead()`, `data.js`, `load()`, `search()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (4 nodes): `tween.js`, `easeOutCubic()`, `lerpPoints()`, `tween()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.