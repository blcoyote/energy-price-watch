---
name: add-energy-slice
description: "Use when adding a new energy feature slice (e.g. electricity prices, gas prices, standing charges). Scaffolds the full vertical slice: types, query keys, fetch function, TanStack Query hook, chart component, and barrel export. Invoke with the slice name, e.g. /add-energy-slice gas-prices."
argument-hint: "<slice-name> — e.g. gas-prices, standing-charges, carbon-intensity"
---

# Add Energy Slice

Scaffolds a complete vertical slice under `src/features/<slice-name>/` following the project's architecture conventions.

## When to Use

- Adding a new energy data domain (electricity prices, gas prices, carbon intensity, standing charges, etc.)
- The feature needs its own API hook, chart component, and TypeScript types

## Procedure

Work through each step in order. Replace `<slice-name>` with the kebab-case name provided (e.g. `gas-prices`) and `<PascalName>` with the PascalCase equivalent (e.g. `GasPrices`).

### Step 1 — Types (`src/features/<slice-name>/types/index.ts`)

Define the raw API response shape and any query parameter types:

```ts
export type <PascalName> = {
  validFrom: string   // ISO 8601
  validTo: string
  valueExcVat: number
  valueIncVat: number
}

export type <PascalName>QueryParams = {
  from: string  // ISO 8601 date
  to: string
}
```

### Step 2 — Query Keys (`src/features/<slice-name>/api/queryKeys.ts`)

```ts
import type { <PascalName>QueryParams } from '../types'

export const <camelName>Keys = {
  all: ['<slice-name>'] as const,
  lists: () => [...<camelName>Keys.all, 'list'] as const,
  list: (params: <PascalName>QueryParams) => [...<camelName>Keys.lists(), params] as const,
}
```

### Step 3 — Fetch Function (`src/features/<slice-name>/api/<camelName>Api.ts`)

```ts
import { ApiError } from '@shared/api/errors'
import type { <PascalName>, <PascalName>QueryParams } from '../types'

export async function fetch<PascalName>s(params: <PascalName>QueryParams): Promise<<PascalName>[]> {
  const url = new URL('/api/<slice-name>', import.meta.env.VITE_API_BASE_URL)
  url.searchParams.set('from', params.from)
  url.searchParams.set('to', params.to)

  const res = await fetch(url)
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json() as Promise<<PascalName>[]>
}
```

### Step 4 — Data Transform (`src/features/<slice-name>/utils.ts`)

```ts
import type { <PascalName> } from './types'

export type <PascalName>ChartPoint = {
  timestamp: string
  price: number
}

export function to<PascalName>ChartData(items: <PascalName>[]): <PascalName>ChartPoint[] {
  return items.map(item => ({
    timestamp: new Date(item.validFrom).toLocaleTimeString(),
    price: item.valueIncVat,
  }))
}
```

### Step 5 — Query Hook (`src/features/<slice-name>/api/use<PascalName>s.ts`)

```ts
import { useQuery } from '@tanstack/react-query'
import { <camelName>Keys } from './queryKeys'
import { fetch<PascalName>s } from './<camelName>Api'
import { to<PascalName>ChartData } from '../utils'
import type { <PascalName>QueryParams } from '../types'

export function use<PascalName>s(params: <PascalName>QueryParams) {
  return useQuery({
    queryKey: <camelName>Keys.list(params),
    queryFn: () => fetch<PascalName>s(params),
    select: to<PascalName>ChartData,
  })
}
```

### Step 6 — Chart Component (`src/features/<slice-name>/components/<PascalName>Chart.tsx`)

```tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { <PascalName>ChartPoint } from '../utils'

type Props = {
  data: <PascalName>ChartPoint[]
}

export function <PascalName>Chart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis unit="p" />
        <Tooltip formatter={(v: number) => [`${v}p`, 'Price']} />
        <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Step 7 — Barrel Export (`src/features/<slice-name>/index.ts`)

```ts
export { <PascalName>Chart } from './components/<PascalName>Chart'
export { use<PascalName>s } from './api/use<PascalName>s'
export type { <PascalName>, <PascalName>QueryParams } from './types'
```

### Step 8 — Wire Up

Import through the barrel in `App.tsx` or the relevant route component:

```tsx
import { <PascalName>Chart, use<PascalName>s } from '@features/<slice-name>'
```

## Checklist

- [ ] `types/index.ts` — API shape + query params
- [ ] `api/queryKeys.ts` — typed key factory
- [ ] `api/<camelName>Api.ts` — raw fetch function
- [ ] `utils.ts` — chart data transform
- [ ] `api/use<PascalName>s.ts` — TanStack Query hook with `select`
- [ ] `components/<PascalName>Chart.tsx` — dumb chart component
- [ ] `index.ts` — barrel with public exports only
- [ ] Imported via path alias in consuming component
