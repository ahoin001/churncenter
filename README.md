# ChurnCenter

Calm headquarters for bank checking and savings bonus chasing.

Track deals, requirements, deadlines, clawbacks, and cooldowns without a spreadsheet — local-first on your device (Vite + React + TypeScript). Data lives in `localStorage` with versioned migrations. No Plaid / no backend.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run test
npm run build
```

## How to chase an offer

1. **Banks** — Add the institution (search popular banks or type a custom name).
2. **Profile** (optional but useful for DD deals) — Set typical net pay amount, pay frequency, and next payday so Today can check whether a direct-deposit window fits.
3. **Watch → Add offer** — Pick a deal pattern and fill required fields (bank, pattern details, bonus). Title is auto-generated from bank + pattern. Notes, capital, expiry, and fees are optional.
4. Optionally set **cash available to park** in Settings so Watch can soft-check whether a savings offer fits your free capital (never blocks you).
5. Optionally set **account fees & conditions** so monthly fees don’t eat the bonus.
6. **Enroll** when you’re ready to open. Log progress on the enrollment; Today nudges deadlines, holds, fees, and unlocks.
7. After the bonus posts, track **clawback**, then close and let **cooldown** resurface when you’re re-eligible.

## Pages

| Route | Purpose |
|---|---|
| `/` Today | Wins, capital in motion, action queue |
| `/active` | Pipeline of open chases |
| `/active/:id` | Enrollment detail — requirements, dates, fees |
| `/watch` | Deals you’re considering; add offer + enroll |
| `/banks` | Institution memory and cooldowns |
| `/profile` | Pay schedule for DD feasibility |
| `/settings` | Theme, prefs, move devices, demo, reset |
| `/dev/ui` | Design system gallery |

## Move to another device

No cloud account. In **Settings → Move to another device**:

1. **Copy transfer link** — compresses your ledger into a URL (`#transfer=…`). Open that link on the other device and confirm **Restore**.
2. If the ledger is too large for a link (attachments, very long notes), use **Export JSON** on this device and **Import JSON** on the other.

Transfer links are carried in the URL hash (not uploaded anywhere). Chat apps may truncate very long links — prefer the JSON file when in doubt.

## Demo data

Demo and reset live in **Settings** (not on Today):

- **Load demo data** — sample Chase / Ally / Capital One / E\*TRADE-style savings chase so you can explore the flow.
- **Remove demo data** — clears banks, offers, enrollments, and activity; keeps preferences.
- **Reset all data** — full wipe including preferences. Export a backup first.

## Tips

- Follow the bank’s published terms; ChurnCenter is a tracker, not advice to misrepresent deposits.
- Savings holds are tracked as “after funding is complete.” If the offer starts the hold when the *funding period* ends, put that exact sentence in Terms notes and still use the Savings pattern for progress.
- Export a backup (link or JSON) before **Reset all data** or clearing site data.

## Architecture (devs)

Domain math: `src/domain/` · Store: `useChurnStore` in `src/data/store.ts` · Persistence: `LocalStorageRepository` · Migrations: `src/data/migrations/`

UI never writes `localStorage` directly.

## Design

**Clearwater** — Companion soft materials + Robinhood/Uber clarity.

- [`PRODUCT.md`](./PRODUCT.md)
- [`docs/DESIGN_PILLARS.md`](./docs/DESIGN_PILLARS.md)
- [`docs/CLEARWATER_FEEL.md`](./docs/CLEARWATER_FEEL.md)

Tokens: `src/styles/tokens.css` · Motion: `src/motion/` · Components: `src/components/`
