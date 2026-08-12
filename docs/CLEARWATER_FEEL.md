# Clearwater Feel — Design & Motion README

**Purpose:** Recreate ChurnCenter’s feel on any surface by adopting the system — not by copying screens.

**Feeling in one sentence:** A calm **money place** with Companion soft materials and Robinhood/Uber clarity — large numbers, sparse chrome, physical springs, zero cockpit stress.

**Inspired by:** AuraFit Companion (world, soft solids, motion catalog) + Robinhood (numeric calm) + Uber (clean spatial UI).

---

## Architecture (one owner per concern)

```
Feature views
  → consume theme tokens + interaction API
  → never hardcode springs / radii / shadows / raw accents

Interaction API (`src/motion/interaction.ts`)
  → animation(style, reduceMotion)
  → press / stagger / transitions

Motion catalog (`src/motion/catalog.ts`)
  → spring tables + theatrical tokens

Visual tokens (`src/styles/tokens.css`)
  → color / fill / stroke / type / space / radius / elevation
```

### Rules

1. One owner per concern.
2. Features call **styles** (`snap`, `content`, `gentle`) — never raw spring numbers.
3. Retuning one catalog spring changes feel app-wide.
4. No parallel local design kits.

---

## Visual language

### Atmosphere
- Habitat field token as full-bleed background
- 1–2 soft radial washes (low opacity), `pointer-events: none`
- No loud multi-color gradients

### Surfaces
- Solid card fills — no glass
- Radii: control `sm`, card `lg` (~20–24), sheet `xl`
- Elevation: `surface` / `raised` / `floating` soft shadows
- Hairline strokes for separation

### Type
- One family: **Manrope**
- Roles: `display`, `title`, `body`, `caption`, `numericHero`, `micro`
- Tabular nums for money and counters

### Color discipline
- Semantic only: bg, surface, ink, muted, accent, border, success, warn, danger
- Accent mint for primary + positive progress
- No naked system blues in features

---

## Motion language

| Style | Intent |
|-------|--------|
| `quick` | Press / micro |
| `snap` | Mutations, immediate commits |
| `content` | Cards & staged appear |
| `gentle` | Soft ambient |
| `sheet` | Sheet present |
| `number` | Counting / gauge settle |
| `celebrate` | Rare completion (playful overshoot) |
| `ease` | Reduce-motion / non-spring tick |

### Defaults (tune only in catalog)

| Token | Response | Damping |
|-------|----------|---------|
| quick | 0.20 | 0.78 |
| snap | 0.26 | 0.84 |
| content | 0.50 | 0.86 |
| gentle | 0.52 | 0.90 |
| sheet | 0.48 | 0.84 |
| number | 0.34 | 0.84 |
| celebrate | 0.48 | 0.58 |
| stagger base | 32ms | — |
| press scale | 0.97 | — |
| reduce motion | 160ms ease | — |

### Staging
- Appear: opacity + y≈12 + scale≈0.985
- Never scale from 0
- List remove softer/shorter than insert
- High-frequency actions: little or no animation

---

## Signature set pieces

1. **Today hero** — one composition: expected cash + calm tide story (not a widget grid)
2. **Tide Gauge** — requirement progress as soft horizontal fill; celebrate only on complete
3. **Sheet entrance** — chrome settles, then content; exit content first, then dismiss
4. **Ambient wash drift** — slow ease loop on atmosphere, disabled under Reduce Motion

---

## Anti-patterns

| Ban | Why |
|-----|-----|
| Glass / backdrop-blur chrome | Breaks soft solid world |
| Raw springs in features | Forks the feel |
| Scale from 0 | Feels fake |
| Dashboard-first Today | Kills “place” |
| Panic-red urgency walls | Stressful money UI |
| Loud celebration on routine actions | Exhausts magic |
| Parallel token kits | Drift |

---

## Build order

### Phase A — Foundations
- [x] Tokens object / CSS variables
- [ ] Theme provider
- [ ] Motion catalog + interaction gate
- [ ] Press + stagger + transitions
- [ ] Surface, Button, Chip, Gauge

### Phase B — World
- [ ] Atmosphere
- [ ] Sheet chrome
- [ ] Today hero composition
- [ ] Soft empty states

### Phase C — Signature
- [ ] Tide Gauge celebrate
- [ ] Sheet entrance/exit
- [ ] Ambient wash (RM-safe)

### Phase D — Harden
- [ ] No raw springs / system colors in features
- [ ] Document style → situation map (this file)
