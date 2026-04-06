import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toKwh } from '../utils'
import type { ElectricityPriceChartPoint } from '../utils'

const COLOR_NOW = '#f97316'      // orange-500 — current hour highlight

/** Returns a fill colour for a column based on its total price. lightness=62 for spot, 44 for tariff. */
function barFill(totalDKK: number, minVal: number, maxVal: number, lightness: number): string {
  if (totalDKK === minVal) return `hsl(142, 71%, ${lightness}%)`  // green
  if (totalDKK === maxVal) return `hsl(0, 72%, ${lightness}%)`    // red
  return `hsl(221, 83%, ${lightness}%)`                           // blue
}

export type SelectedPriceEntry = {
  time: string
  timestamp: string
  spotDKK: number
  tariffDKK: number
  totalDKK: number
}

type Props = {
  data: ElectricityPriceChartPoint[]
  /** 24-element array indexed by DK hour-of-day (0=00:00…23=23:00), DKK/kWh. */
  tariff?: number[]
  /** Current Danish hour (0-23) to highlight. Omit when showing a future day. */
  currentDkHour?: number
  /** Timestamp of the bar the user has selected. */
  selectedTimestamp?: string
  onBarClick?: (entry: SelectedPriceEntry) => void
}

export function ElectricityPriceChart({ data, tariff, currentDkHour, selectedTimestamp, onBarClick }: Props) {
  const chartData: SelectedPriceEntry[] = data.map(d => {
    const spot = toKwh(d.priceDKK)
    // Extract DK hour directly from the TimeDK ISO string (YYYY-MM-DDTHH:mm:ss)
    const hourIndex = parseInt(d.timestamp.slice(11, 13), 10)
    const tariffVal = tariff != null ? (tariff[hourIndex] ?? 0) : 0
    return {
      time: d.time,
      timestamp: d.timestamp,
      spotDKK: spot,
      tariffDKK: tariffVal,
      totalDKK: Math.round((spot + tariffVal) * 100) / 100,
    }
  })

  const totals = chartData.map(d => d.totalDKK)
  const minVal = Math.min(...totals)
  const maxVal = Math.max(...totals)
  const hasNegative = minVal < 0
  const unit = ' DKK/kWh'

  // Find the bar whose timestamp hour matches currentDkHour for the reference line
  const nowEntry = currentDkHour != null
    ? chartData.find(d => parseInt(d.timestamp.slice(11, 13), 10) === currentDkHour)
    : undefined

  function handleBarClick(barData: unknown) {
    if (!onBarClick) return
    const entry = barData as SelectedPriceEntry
    if (entry?.timestamp) onBarClick(entry)
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
        style={{ cursor: onBarClick ? 'pointer' : undefined }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v: number) => v.toFixed(2)}
          unit={unit}
          width={96}
        />
        <Tooltip
          formatter={(value, name) => {
            const label =
              name === 'spotDKK' ? 'Spotpris' :
              name === 'tariffDKK' ? 'Tarif' :
              String(name)
            return [value != null ? `${Number(value).toFixed(2)}${unit}` : '-', label]
          }}
          labelFormatter={(label) => `Kl. ${String(label)}`}
        />
        {tariff != null && (
          <Legend formatter={(value: string) => value === 'spotDKK' ? 'Spotpris' : 'Tarif'} />
        )}
        <Bar
          dataKey="spotDKK"
          name="spotDKK"
          stackId="price"
          isAnimationActive={false}
          onClick={handleBarClick}
          background={(bgProps: { x?: number; y?: number; width?: number; height?: number; index?: number }) => {
            if (!onBarClick) return <g />
            const { x = 0, y = 0, width = 0, height = 0, index = 0 } = bgProps
            const entry = chartData[index]
            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG context — <button> is not valid inside <svg>
              <rect
                role="button"
                aria-label={entry ? `Vælg pris for ${entry.time}` : undefined}
                x={x}
                y={y}
                width={width}
                height={height}
                fill="rgba(0,0,0,0)"
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onClick={() => { if (entry) onBarClick(entry) }}
              />
            )
          }}
          shape={(props: { x?: number; y?: number; width?: number; height?: number; timestamp?: string; totalDKK?: number }) => {
            const { x = 0, width = 0, timestamp = '', totalDKK = 0 } = props
            // Recharts passes negative height for negative-value bars in a single-entry stack.
            // Normalise so the rect always has a positive height and y at the top edge.
            let { y = 0, height = 0 } = props
            if (height < 0) { y += height; height = -height }
            const isNow = nowEntry != null && timestamp === nowEntry.timestamp
            const isSelected = selectedTimestamp != null && timestamp === selectedTimestamp
            const fill = isNow
              ? COLOR_NOW
              : barFill(totalDKK, minVal, maxVal, 62)
            return (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                opacity={isNow ? 1 : 0.85}
                stroke={isSelected ? '#fff' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
              />
            )
          }}
        />
        {tariff != null && (
          <Bar
            dataKey="tariffDKK"
            name="tariffDKK"
            stackId="price"
            isAnimationActive={false}
            onClick={(barData: unknown) => { handleBarClick(barData) }}
            shape={(props: { x?: number; y?: number; width?: number; height?: number; timestamp?: string; totalDKK?: number }) => {
              const { x = 0, width = 0, timestamp = '', totalDKK = 0 } = props
              let { y = 0, height = 0 } = props
              if (height < 0) { y += height; height = -height }
              const isNow = nowEntry != null && timestamp === nowEntry.timestamp
              const fill = isNow ? '#ea580c' : barFill(totalDKK, minVal, maxVal, 44)
              return <rect x={x} y={y} width={width} height={height} fill={fill} />
            }}
          />
        )}
        {hasNegative && (
          <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 2" />
        )}
        {currentDkHour != null && nowEntry != null && (
          <ReferenceLine
            x={nowEntry.time}
            stroke={COLOR_NOW}
            strokeWidth={3}
            label={{ value: '▶ Nu', fill: COLOR_NOW, fontSize: 12, fontWeight: 700, position: 'insideTopRight', offset: 8 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}
