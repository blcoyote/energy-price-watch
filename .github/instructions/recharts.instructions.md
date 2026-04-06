---
description: "Use when building chart components, visualising energy price data, or working with recharts. Covers chart structure, data-shaping conventions, responsive containers, and accessible colour palettes."
applyTo: "src/features/**/components/**"
---

# Recharts Visualisation Patterns

## Core Principle

Chart components are **dumb display components** — they accept pre-shaped data via props and render only. All data transformation (normalisation, unit conversion, aggregation) must happen in the slice's `api/` layer or `utils.ts` before reaching the component.

## Minimal Chart Template

```tsx
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

type PricePoint = { timestamp: string; pricePence: number }

type ElectricityPriceChartProps = {
  data: PricePoint[]
}

export function ElectricityPriceChart({ data }: ElectricityPriceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis unit="p" />
        <Tooltip formatter={(v: number) => [`${v}p`, 'Price']} />
        <Legend />
        <Line type="monotone" dataKey="pricePence" stroke="#2563eb" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

## Rules

- Always wrap in `<ResponsiveContainer>` — never hardcode pixel widths.
- Specify a `height` on `<ResponsiveContainer>` in pixels (or `aspect` ratio) — `height="100%"` requires a sized parent and is fragile.
- Use `dot={false}` on `<Line>` for dense time-series data (many data points).
- Pass a `formatter` to `<Tooltip>` to include units in the tooltip.

## Data Shape Convention

Transform raw API responses into flat arrays of plain objects before passing to charts:

```ts
// utils.ts — pure transformation, no hooks
export function toChartData(prices: ElectricityPrice[]): PricePoint[] {
  return prices.map(p => ({
    timestamp: new Date(p.validFrom).toLocaleTimeString(),
    pricePence: p.valueIncVat,
  }))
}
```

Call `toChartData` inside the TanStack Query `select` option to keep the component props typed and minimal:

```ts
export function useElectricityPrices(params: PriceQueryParams) {
  return useQuery({
    queryKey: electricityPriceKeys.list(params),
    queryFn: () => fetchElectricityPrices(params),
    select: toChartData,
  })
}
```

## Colour Palette

Use consistent semantic colours across all energy charts:

| Series          | Hex       | Tailwind |
|-----------------|-----------|----------|
| Electricity     | `#2563eb` | blue-600 |
| Gas             | `#16a34a` | green-600 |
| Peak / High     | `#dc2626` | red-600  |
| Off-peak / Low  | `#9333ea` | purple-600|

## Multi-Series Charts

When rendering electricity vs gas on the same chart, each `<Line>` / `<Bar>` needs a unique `dataKey` and `stroke`:

```tsx
<Line dataKey="electricityPence" stroke="#2563eb" name="Electricity" dot={false} />
<Line dataKey="gasPence" stroke="#16a34a" name="Gas" dot={false} />
```

## Chart Types by Use Case

| Use case                          | Chart component       |
|-----------------------------------|-----------------------|
| Price over time (single tariff)   | `<LineChart>`         |
| Price comparison (multiple)       | `<LineChart>` (multi) |
| Daily / monthly cost breakdown    | `<BarChart>`          |
| Proportion (e.g. peak vs off-peak)| `<PieChart>`          |
| Current vs average snapshot       | `<RadialBarChart>`    |
