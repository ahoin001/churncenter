# ChurnCenter

Calm headquarters for bank checking/savings bonus chasing.

Local-first web app (Vite + React + TypeScript). Data persists in `localStorage` with versioned migrations. No Plaid / no backend through V3.

## Design

**Clearwater** — Companion soft materials + Robinhood/Uber clarity.

- [`PRODUCT.md`](./PRODUCT.md)
- [`docs/DESIGN_PILLARS.md`](./docs/DESIGN_PILLARS.md)
- [`docs/CLEARWATER_FEEL.md`](./docs/CLEARWATER_FEEL.md)

Tokens: `src/styles/tokens.css` · Motion: `src/motion/` · Components: `src/components/`

## Develop

```bash
npm install
npm run dev
```

Useful routes:

- `/` Today HQ
- `/active` Pipeline
- `/watch` Watchlist
- `/banks` Institution memory
- `/settings` Backup / demo / reset
- `/dev/ui` Design system gallery

```bash
npm run test
npm run build
```

## Architecture

Domain math lives in `src/domain/`. UI never touches `localStorage` directly — use `useChurnStore` (`src/data/store.ts`) which persists through `LocalStorageRepository`.
