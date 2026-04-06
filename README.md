# ⚡ Energy Price Watch

Live day-ahead electricity prices for Denmark, built with React + TypeScript.

**[→ blcoyote.github.io/energy-price-watch](https://blcoyote.github.io/energy-price-watch/)**

---

## Hvad gør den?

- Henter **day-ahead spotpriser** for DK1 (Vest) og DK2 (Øst) fra [Energi Data Service](https://www.energidataservice.dk/tso-electricity/DayAheadPrices)
- Henter **nettariffer** fra de lokale netselskaber via [DatahubPricelist](https://www.energidataservice.dk/datahub/DatahubPricelist) og lægger dem oven på spotprisen
- Viser **morgendagens priser** automatisk fra kl. 13:00, hvor Nord Pool offentliggør dem
- Fremhæver **den aktuelle time** med orange farve og en referencelinje
- Klikbar søjlegraf — vælg en time for at se spot- og totalpris
- Søjlerne er farvekodet: **grøn** = billigste, **rød** = dyreste, **blå** = øvrige
- Opdaterer automatisk én gang i timen

## Stack

| Lag | Teknologi |
| --- | --- |
| UI | React 19 (React Compiler) + TypeScript |
| Build | Vite 8 |
| Server state | TanStack Query v5 |
| Graf | Recharts v3 |
| Linting | Biome |
| Package manager | pnpm |

## Arkitektur

Koden er organiseret som **vertical slices** under `src/features/`:

```text
src/
  features/
    electricity-prices/
      api/          # TanStack Query hooks
      components/   # ElectricityPriceChart
      types/        # TypeScript interfaces + netselskaber
      utils.ts      # toKwh, toElectricityChartData
      useDanishDateWindow.ts
      index.ts      # Public barrel export
  shared/
    api/            # ApiError
  App.tsx
  main.tsx
```

## Kom i gang

```bash
pnpm install   # installer afhængigheder
pnpm dev       # start udviklingsserver
pnpm build     # typetjek + byg
pnpm lint      # Biome lint
```

## Deploy

Appen deployes automatisk til GitHub Pages via `.github/workflows/deploy.yml` ved hvert push til `main`.
