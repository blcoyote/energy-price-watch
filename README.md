# ⚡ Energy Price Watch

Live day-ahead electricity prices for Denmark, built with React + TypeScript.

**[→ blcoyote.github.io/energy-price-watch](https://blcoyote.github.io/energy-price-watch/)**

![CI](https://github.com/blcoyote/energy-price-watch/actions/workflows/ci.yml/badge.svg)

---

## What does it do?

- Fetches **day-ahead spot prices** for DK1 (West) and DK2 (East) from [Energi Data Service](https://www.energidataservice.dk/tso-electricity/DayAheadPrices)
- Fetches **grid tariffs** (hourly energy tariffs only, `ResolutionDuration: PT1H`) via [DatahubPricelist](https://www.energidataservice.dk/datahub/DatahubPricelist) for your configured net company and adds them on top of the spot price
- Includes **public fees** (elafgift, Energinet system tariff, transmission tariff) on top of the tariff — all ex VAT, multiplied by 1.25
- Shows **tomorrow's prices** via chevron navigation — available after ~13:00 when Nord Pool publishes them
- Highlights the **current hour** in the chart with a reference line
- Clickable bar chart — select an hour to see the spot price and total consumer price
- Bars are colour-coded: **green** = cheapest, **red** = most expensive, **blue** = the rest
- Toggle tariffs and fees on/off to compare spot-only vs total consumer price
- **Dark/light mode** toggle, follows system preference by default
- **Fullscreen** button for wall-display or PWA use
- Automatically refreshes once per hour; price area and tariff toggle are persisted in `localStorage`

## Configuring your net company

Edit `src/config.ts` and set `MY_GRID_COMPANY` to your DSO:

```ts
export const MY_GRID_COMPANY: GridCompanyId = "dinel";
```

Valid values:

| ID | Company | Area |
| --- | --- | --- |
| `radius` | Radius Elnet | DK2 – Greater Copenhagen |
| `cerius` | Cerius | DK2 – North Zealand |
| `n1` | N1 | DK1 – North/Mid Jutland |
| `trefor` | TREFOR El-net | DK1 – South Jutland |
| `konstant` | Konstant Net | DK1 – Mid Jutland |
| `dinel` | Dinel | DK1 – Mid Jutland |

TypeScript will error at build time if the value is not a valid ID.

## Stack

| Layer | Technology |
| --- | --- |
| UI | React 19 (React Compiler) + TypeScript |
| Build | Vite 8 |
| Server state | TanStack Query v5 |
| Chart | Recharts v3 |
| Tests | Vitest 4 |
| Lint/format | Biome |
| Package manager | pnpm |

## Architecture

Code is organised as **vertical slices** under `src/features/`:

```text
src/
  features/
    electricity-prices/
      api/                  # TanStack Query hooks + fetch functions
      components/           # ElectricityPriceChart, PriceControls
      types/                # TypeScript interfaces, GridCompanyId, GRID_COMPANIES
      config.ts             # User-facing net company config (MY_GRID_COMPANY)
      publicFees.ts         # Year-keyed public fee schedules (elafgift, Energinet)
      utils.ts              # Price composition helpers, chart data shaping
      useDanishDateWindow.ts
      useSelectedEntry.ts
      index.ts              # Public barrel export
  shared/
    api/                    # ApiError
    hooks/                  # useLocalStorage
  ui/
    icons/                  # SVG icon components
  App.tsx
  main.tsx
```

## Getting started

```bash
pnpm install      # install dependencies
pnpm dev          # start dev server
pnpm build        # type-check + build
pnpm lint         # Biome lint
pnpm test         # Vitest (single run)
pnpm test:watch   # Vitest (watch mode)
```

## Deploy & CI

- **Deploy**: The app is automatically deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`.
- **CI**: Pull requests run lint, tests, and build via `.github/workflows/ci.yml`.
