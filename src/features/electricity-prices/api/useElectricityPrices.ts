import { useQuery } from '@tanstack/react-query'
import { electricityPriceKeys } from './queryKeys'
import { fetchElectricityPrices } from './electricityPricesApi'
import { toElectricityChartData } from '../utils'
import type { DayAheadPricesQueryParams } from '../types'

export function useElectricityPrices(params: DayAheadPricesQueryParams) {
  return useQuery({
    queryKey: electricityPriceKeys.list(params),
    queryFn: () => fetchElectricityPrices(params),
    select: toElectricityChartData,
    refetchInterval: 60 * 60 * 1000, // refetch every hour
  })
}
