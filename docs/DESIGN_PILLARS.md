# ChurnCenter Design Pillars

Narrative SSOT for all surfaces. When UI feels off, **rebuild toward these pillars**. Implementation must go through tokens and the motion catalog — never one-off hex, radii, or springs in features.

Portable recreation guide: [`CLEARWATER_FEEL.md`](./CLEARWATER_FEEL.md).

---

## 1. World, not dashboard

First read is a **calm money place** (clear water, quiet air), not a fintech analytics board.

- Full-bleed atmosphere with soft low-contrast washes
- One hero story per viewport (e.g. expected bonus this quarter)
- Instruments (gauges, lists, boards) sit *in* the world
- Dense toolbars, pill clusters, and competing cards are last resorts

## 2. Soft materials + fintech polish

Companion softness meets Robinhood/Uber clarity:

- Solid themed fills only — **no glass / backdrop-blur chrome**
- Continuous soft radii; elevation via soft shadow tokens; hairline structure
- Large calm numbers with tabular figures
- Sparse chrome, confident primary actions, generous whitespace
- Accent is for identity + primary action + positive money — not every glyph
- **Theme modes:** `light` | `dark` | `system` via `preferences.themeMode`; dark is a soft night desk (`[data-theme='dark']`), not neon trading UI

## 3. Quiet hierarchy

1. Display / title (carries its own weight — no decorative eyebrows as section crutches)
2. Body
3. Muted meta
4. Micro labels only when they prevent ambiguity (deadlines, statuses)

## 4. Motion is physical and interruptible

- Springs from **`motion/catalog` only**; call via `interaction.animation`
- Press responds on pointer down; exits softer/shorter than enters
- Animate less when used more; rare delight for bonus posted / requirement complete
- Always honor `prefers-reduced-motion`

## 5. Rebuild permission

If a surface fights the feel, rebuild it. Leave shared primitives stronger. Never fork a parallel local motion or color kit.

## 6. Apply anywhere checklist

1. Atmosphere where the world belongs  
2. Surfaces: fill / radius / elevation from tokens  
3. Type roles from tokens  
4. Spacing from tokens  
5. Motion from catalog + interaction API  
6. Empty / loading / error still soft and calm  
