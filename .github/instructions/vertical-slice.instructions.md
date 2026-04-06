---
description: "Use when adding a new feature slice, creating files in src/features/, structuring components, or organising feature code. Covers the vertical slice folder layout, barrel exports, and cross-slice import rules."
---

# Vertical Slice Architecture

## Folder Layout

Every feature lives in `src/features/<slice-name>/` and is fully self-contained:

```
src/features/electricity-prices/
  api/
    queryKeys.ts            # Typed query key factory
    electricityPricesApi.ts # Raw fetch functions
    useElectricityPrices.ts # TanStack Query hook(s)
  components/
    ElectricityPriceChart.tsx
    ElectricityPriceTable.tsx
  types/
    index.ts                # ElectricityPrice, PriceQueryParams, etc.
  utils.ts                  # Pure data-transformation helpers (optional)
  index.ts                  # Public barrel — only export what consumers need
```

## Rules

1. **No cross-slice internal imports.** Other slices must import from the slice's `index.ts`, not from internal paths.
   - ✅ `import { useElectricityPrices } from '@features/electricity-prices'`
   - ❌ `import { useElectricityPrices } from '@features/electricity-prices/api/useElectricityPrices'`

2. **Shared code goes in `src/shared/`** — only if used by 2+ slices. Don't pre-emptively move things there.

3. **`index.ts` is the contract.** Only expose what external consumers need. Keep internals private.

4. **No default exports inside a slice** (except route-level page components). Use named exports everywhere.

## index.ts Template

```ts
// src/features/electricity-prices/index.ts
export { ElectricityPriceChart } from './components/ElectricityPriceChart'
export { useElectricityPrices } from './api/useElectricityPrices'
export type { ElectricityPrice, PriceQueryParams } from './types'
```

## Adding a New Slice Checklist

- [ ] Create `src/features/<name>/` with `api/`, `components/`, `types/`, `index.ts`
- [ ] Add query key factory in `api/queryKeys.ts`
- [ ] Add raw fetch functions in `api/<name>Api.ts`
- [ ] Add TanStack Query hook in `api/use<Name>.ts`
- [ ] Define TypeScript types in `types/index.ts`
- [ ] Export public API from `index.ts`
- [ ] Register route or import in `App.tsx` via `@features/<name>`

## Path Aliases

Configure in both `tsconfig.app.json` and `vite.config.ts`:

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "paths": {
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

```ts
// vite.config.ts
import path from 'path'
resolve: {
  alias: {
    '@features': path.resolve(__dirname, 'src/features'),
    '@shared': path.resolve(__dirname, 'src/shared'),
  },
}
```
