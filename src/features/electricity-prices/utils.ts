import type { DayAheadPrice } from './types'

export type ElectricityPriceChartPoint = {
  // Local Danish time formatted for display (e.g. "14:00")
  time: string
  // Full ISO timestamp of the hour (used as unique chart key)
  timestamp: string
  priceEUR: number
  priceDKK: number
}

/**
 * Aggregates 15-minute DayAheadPrices records into hourly averages.
 * Records belonging to the same clock-hour (per Danish local time) are averaged.
 */
export function toElectricityChartData(records: DayAheadPrice[]): ElectricityPriceChartPoint[] {
  // Group by the hour portion of TimeDK (e.g. "2026-04-06T14")
  const hourMap = new Map<string, { sumEUR: number; sumDKK: number; count: number; timeDK: string }>()

  for (const r of records) {
    const hourKey = r.TimeDK.slice(0, 13) // "YYYY-MM-DDTHH"
    const existing = hourMap.get(hourKey)
    if (existing) {
      existing.sumEUR += r.DayAheadPriceEUR
      existing.sumDKK += r.DayAheadPriceDKK
      existing.count += 1
    } else {
      hourMap.set(hourKey, { sumEUR: r.DayAheadPriceEUR, sumDKK: r.DayAheadPriceDKK, count: 1, timeDK: r.TimeDK })
    }
  }

  return Array.from(hourMap.values()).map(({ sumEUR, sumDKK, count, timeDK }) => ({
    time: new Date(timeDK).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
    timestamp: timeDK,
    priceEUR: Math.round((sumEUR / count) * 100) / 100,
    priceDKK: Math.round((sumDKK / count) * 100) / 100,
  }))
}

/** Convert MWh price → kWh price, rounded to 2 decimal places. */
export function toKwh(mwhPrice: number): number {
  return Math.round((mwhPrice / 1000) * 100) / 100
}
