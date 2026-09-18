---
name: Middle Kingdom Explorer
description: 4,000 years of Chinese history as one scrubbable timeline and living map, in an illustrated comic-panel style.
colors:
  paper: "#fff7e8"
  ink: "#2b2118"
  ink-soft: "#6b5a4a"
  red: "#d63a30"
  gold: "#f4b942"
  jade: "#3fa67a"
  sky: "#58a6e0"
  plum: "#9b59b6"
  sea: "#cfe8f5"
  land: "#f6e2b4"
  card: "#ffffff"
  cat-dynasty: "#f4b942"
  cat-war: "#d63a30"
  cat-tech: "#58a6e0"
  cat-nature: "#3fa67a"
  cat-people: "#9b59b6"
  cat-other: "#f08a5d"
typography:
  display:
    fontFamily: "Fredoka, Nunito, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Fredoka, Nunito, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 800
rounded:
  pill: "999px"
  lg: "18px"
  md: "14px"
  sm: "12px"
  xs: "8px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "30px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-ghost:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  card-teaser:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  chip:
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  badge:
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Middle Kingdom Explorer

## Overview

**Creative North Star: "The Comic-Panel History Book"**

Middle Kingdom Explorer reads like an illustrated children's atlas rebuilt for adults: warm cream paper, thick candy-colored ink, and chunky solid-offset shadows that make every card feel like a physical panel sitting slightly off the page. The system is playful and tactile without going childish — body copy stays plain and factual (PRODUCT.md's "playful but not childish" principle), while the chrome around it (buttons, chips, badges, the timeline itself) carries all the personality. Nothing in the shipped UI uses blur-based drop shadows, gradients-as-depth, or a muted "serious archive" palette; depth and hierarchy come entirely from flat color, solid hard-offset shadows, and pill/rounded geometry.

Emoji glyphs (🐉 🎒 🔍 👑 ⚔️ 💡 🐼) are used throughout as the icon system — for category markers, buttons, teaser cards, and the tour guide. This is a native, load-bearing device of this world's illustrated-atlas identity (PRODUCT.md's "playful illustrated visual style," carried over verbatim from the approved mockup), not a placeholder to be swapped for an icon font or SVG set later.

**Key Characteristics:**
- Warm cream paper background throughout; never pure white as a page surface
- Hard, solid (non-blurred) offset shadows on cards, buttons, and floating UI chrome — the signature "comic panel" depth cue
- Fredoka for all display/heading text, Nunito for everything read at length
- Pill-shaped (999px) buttons, chips, and badges; softly rounded (12–18px) cards and panels
- Category color is a first-class UI signal (dynasty/war/tech/nature/people/other), carried consistently across chips, timeline bands, map legend, and detail badges

## Colors

The palette is warm-paper-and-ink as a base, with six saturated accent colors that map 1:1 to the six event categories.

### Primary
- **Signal Red** (`#d63a30`): primary action color — hero "Explore freely" button, hero H1 accent word, active playhead on the timeline, About-page heading. Also the Wars category color.

### Secondary
- **Imperial Gold** (`#f4b942`): secondary action color — "Grand Tour" buttons, timeline scrollbar, year badge text, active tour-dot indicator. Also the Dynasty category color.

### Tertiary
- **Category Spectrum**: Jade `#3fa67a` (Nature & Disasters), Sky Blue `#58a6e0` (Tech), Plum `#9b59b6` (People), Warm Orange `#f08a5d` (Big news/Other). Each is used consistently as that category's chip, timeline band, map pin, and detail-badge color — never reused for an unrelated purpose.

### Neutral
- **Warm Paper** (`#fff7e8`): page background for landing, explore shell, and the slide-in detail panel. Never swapped for pure white as a full-page surface.
- **Ink** (`#2b2118`): primary text color, and inverted as the background of the tour sidebar/sheet.
- **Ink Soft** (`#6b5a4a`): secondary/muted text — taglines, captions, era subtitles, credit lines.
- **Card White** (`#ffffff`): the surface color for cards, panels, and popovers that need to sit above the paper background (teaser cards, search results, era label, year badge).
- **Sea** (`#cfe8f5`) / **Land** (`#f6e2b4`): map-only water/landmass fills, not used elsewhere in the UI.

### Named Rules
**The One Category, One Color Rule.** A category's color is identical everywhere it appears — chip, timeline band, map pin, detail badge. Never reassign a category color contextually, and never introduce a new accent color for a UI element that already has a category mapping.

## Typography

**Display Font:** Fredoka (with Nunito, sans-serif fallback)
**Body Font:** Nunito (variable weight 200–1000, with system-ui, sans-serif fallback)

**Character:** Fredoka's rounded, friendly letterforms carry every heading and label, giving the chrome its storybook energy; Nunito stays neutral and legible wherever the user is actually reading — body paragraphs, tags, captions — so the playfulness never undermines readability of factual content.

### Hierarchy
- **Display** (Fredoka 700, `clamp(40px, 7vw, 76px)`, line-height 1): landing hero H1 only.
- **Title** (Fredoka 700, 26–28px, line-height 1.1): detail panel title, era label, tour stop heading.
- **Headline/Label-large** (Fredoka 700, 18–22px): teaser card titles, section headings.
- **Body** (Nunito 400, 15px, line-height 1.55): detail panel paragraphs, tour copy, teaser text.
- **Label** (Nunito 800, 12–14px, uppercase not used — sentence case): chips, badges, buttons, legend tags. Weight 800 is the signal that a piece of text is interactive/tag-like rather than prose.

### Named Rules
**The Two-Voice Rule.** Fredoka is reserved for headings, labels, and UI chrome; Nunito is reserved for anything meant to be read as a sentence. No element mixes the two faces at the same text node.

## Layout

The explore screen is a fixed-height app shell (`#app` pinned `inset:0`, `body { overflow:hidden }`) divided into a topbar, a flexible map/tour row, and a fixed-height timeline strip (260px, 220px at ≤720px). The map row and tour panel share a flex row that collapses to a bottom sheet on narrow viewports rather than stacking literally (a documented fix for a storyboard gap that would have squeezed the map to ~100px tall). Landing and About are simple scrollable single-column screens with a `max-width: 720–1000px` centered content well. Spacing is loose and rounded in multiples of ~6–20px (6/8/10/12/14/16/18/20/30px appear repeatedly; no strict 8pt-grid enforcement observed). Responsive breakpoint: 720px, where the timeline shrinks, the tour becomes a bottom sheet, the search input narrows, and the map legend is dropped for space.

## Elevation & Depth

This system does not use blurred, ambient drop shadows anywhere. Depth is conveyed exclusively through **hard, solid-color offset shadows** — a flat color block offset a few pixels below-right of the element, with zero blur radius — which reads as a physical paper/ink layer rather than a lit 3D surface. The one blurred-shadow exception is the slide-in detail panel and its scrim, which use a soft shadow (`-10px 0 30px rgba(0,0,0,.15)`) and a dim overlay because that panel is a true modal layer above the whole app, not a resting surface.

### Shadow Vocabulary
- **Card shadow** (`box-shadow: 0 6px 0 rgba(43,33,24,.12)`): resting elevation for teaser cards, era label, year badge, close button — the default "comic panel" offset.
- **Button shadow, primary** (`box-shadow: 0 4px 0 #b0332b`): beneath `.btn` (red); collapses to none on `:active` as the button "presses" down (`translateY(3px)`).
- **Button shadow, gold** (`box-shadow: 0 4px 0 #c48f1f`): beneath `.btn.gold`.
- **Button shadow, ghost** (`box-shadow: 0 4px 0 #ddd0b8`): beneath `.btn.ghost` and other neutral pill controls (related-event chips, timeline tool buttons).
- **Event card shadow** (`box-shadow: 0 3px 0 rgba(43,33,24,.12)`): smaller, same hard-offset treatment, for the compact event cards on the timeline.
- **Modal shadow** (`box-shadow: -10px 0 30px rgba(0,0,0,.15)`): the one blurred shadow, reserved for the detail panel's edge against the scrim.

### Named Rules
**The Press-Down Rule.** Every hard-offset button collapses its shadow and translates down on `:active`, simulating a physical button press. A button without this offset-then-collapse behavior is not using the system's primary button pattern.

## Shapes

Two radius families coexist by role. **Pill (999px)** is reserved for anything interactive and tag-like: buttons, chips, badges, search input, timeline tool buttons, legend tags. **Soft rounded rectangles (12–18px)** are reserved for containers and surfaces: cards, the detail panel's internal boxes, era label, year badge, search-results popover. The circle (50%) appears once, for the panel's close button. No sharp (0px) corners appear anywhere in the shipped UI; no border strokes are used for definition — separation between surfaces comes from background-color contrast and the hard-offset shadow, not from outlines (except the 2–3px solid dividers between structural regions like the topbar/timeline, which are a flat hairline, not a card-level border).

## Components

### Buttons
- **Shape:** pill (`border-radius: 999px`)
- **Primary** (`.btn`): red background, white text, weight 800, 12px/22px padding, hard gold-brown offset shadow beneath.
- **Gold** (`.btn.gold`): same shape, gold background, ink text — used for the Grand Tour call-to-action specifically, never as a generic secondary.
- **Ghost** (`.btn.ghost`): white background, ink text, neutral offset shadow — used for prev/next and back navigation.
- **Small** (`.btn.sm`): 8px/14px padding, 14px text — used inside the detail panel and tour sidebar where space is tighter.
- **Active/press state:** shadow collapses to none, button translates down 3px (see Press-Down Rule).

### Chips
- **Style:** pill shape, category color as background, white or ink text depending on contrast (`textOn()` helper picks per-color), weight 800, 13px.
- **State:** unselected chips are grayscale + 55% opacity (`filter: grayscale(1) opacity(.55)`), selected (`.chip.on`) shows full color. Hover scales to 1.05.

### Cards / Containers
- **Teaser card:** 18px radius, white background, 20px padding, hard card shadow, lifts and rotates slightly on hover (`translateY(-4px) rotate(-1deg)`) — the one place rotation is used as a hover cue.
- **Event card (timeline):** 12px radius, white background, compact padding, hard event-card shadow, scales 1.08 on hover/active glow with a gold outline ring when active.
- **Detail panel:** slide-in from the right (`width: min(460px, 100%)`), paper background, blurred modal shadow, `cubic-bezier(.22,1,.36,1)` slide transition.
- **"Why it matters" callout:** 12px radius, `#fff2d6` tinted background (a warm highlight tint distinct from paper), no shadow — flat inline emphasis rather than a raised card.

### Badges
- **Style:** pill shape, category/era/year color as background, white or ink text via contrast helper, weight 800, 12px, used for category/era/year/legendary tags stacked at the top of the detail panel.

### Inputs / Fields
- **Style:** pill shape (999px), 2px solid `#eadcc2` border, white background, 8px/14px/8px/34px padding (left space reserved for the 🔍 emoji glyph).
- **Focus:** border color shifts to Sky Blue (`#58a6e0`); no glow or ring.

### Navigation
- **Topbar:** white background, 3px solid `#eadcc2` bottom hairline, logo in Fredoka red, category chips inline, search right-aligned, Grand Tour button pinned to the far right.
- **Timeline:** the primary navigation surface — a horizontally scrollable strip with era color-bands, dashed year ticks, and a red playhead; drag-to-scroll cursor feedback (`grab`/`grabbing`).

### Tour sidebar (signature component)
A dark (`--ink` background, white text) sidebar that docks to the right of the map on desktop and becomes a bottom sheet (rounded top corners, slide-up shadow) below 720px. Progress is shown as a row of pill segments (`.dots i`) that fill gold as stops complete — this is the system's only progress-indicator pattern, and it should be reused rather than inventing a new one for future multi-step flows.

## Do's and Don'ts

### Do:
- **Do** use hard, zero-blur, solid-color offset shadows (`0 Npx 0 <color>`) for anything at resting elevation; reserve blurred shadows for true modal/overlay layers only (the detail panel, search-results popover).
- **Do** use pill radius (999px) for every interactive/tag element and 12–18px rounding for every container surface.
- **Do** use Fredoka for headings/labels and Nunito for body copy; never mix within one text node.
- **Do** keep one category → one color mapping consistent across chips, timeline bands, map pins, and badges.
- **Do** use emoji glyphs as the icon system — they are this world's native iconography, confirmed by the approved mockup and PRODUCT.md's playful-illustrated brand commitment.

### Don't:
- **Don't** introduce blurred ambient drop shadows on resting cards or buttons — it would erase the comic-panel identity that hard offsets establish.
- **Don't** use pure white as a full-page background; the page surface is always the warm paper cream.
- **Don't** introduce a new accent color for a UI element that already maps to a category color.
- **Don't** use sharp (0px) corners or outline-only borders for surface separation; this system defines depth with color and shadow, not strokes.
