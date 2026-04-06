# ⚡ Energy Price Watch

Live day-ahead electricity prices for Denmark, built with React + TypeScript.

**[→ blcoyote.github.io/energy-price-watch](https://blcoyote.github.io/energy-price-watch/)**

![CI](https://github.com/blcoyote/energy-price-watch/actions/workflows/ci.yml/badge.svg)

---

## What does it do?

- Fetches **day-ahead spot prices** for DK1 (West) and DK2 (East) from [Energi Data Service](https://www.energidataservice.dk/tso-electricity/DayAheadPrices)
- Fetches **grid tariffs** (hourly energy tariffs only, `ResolutionDuration: PT1H`) via [DatahubPricelist](https://www.energidataservice.dk/datahub/DatahubPricelist) and adds them on top of the spot price
- Shows **tomorrow's prices** via chevron buttons above the chart — available from 13:00 when Nord Pool publishes them
- Highlights the **current hour** in orange with a reference line
- Clickable bar chart — select an hour to see the spot and total price
- Bars are colour-coded: **green** = cheapest, **red** = most expensive, **blue** = the rest
- Automatically refreshes once per hour

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
      api/          # TanStack Query hooks + fetch functions
      components/   # ElectricityPriceChart
      types/        # TypeScript interfaces + grid companies
      utils.ts      # toKwh, toElectricityChartData
      useDanishDateWindow.ts
      index.ts      # Public barrel export
  shared/
    api/            # ApiError
  ui/
    icons.tsx       # SVG icon components
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
