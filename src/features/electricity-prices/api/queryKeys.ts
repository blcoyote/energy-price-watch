import type { DayAheadPricesQueryParams } from '../types'

export const electricityPriceKeys = {
  all: ['electricity-prices'] as const,
  lists: () => [...electricityPriceKeys.all, 'list'] as const,
  list: (params: DayAheadPricesQueryParams) =>
    [...electricityPriceKeys.lists(), params] as const,
  tariffs: () => [...electricityPriceKeys.all, 'tariffs'] as const,
  tariff: (glnNumber: string) => [...electricityPriceKeys.tariffs(), glnNumber] as const,
}
