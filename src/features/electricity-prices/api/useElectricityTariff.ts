import { useQuery } from '@tanstack/react-query'
import { electricityPriceKeys } from './queryKeys'
import { fetchHourlyTariff } from './datahubTariffApi'

export function useElectricityTariff(glnNumber: string | null) {
  return useQuery({
    queryKey: electricityPriceKeys.tariff(glnNumber ?? ''),
    queryFn: () => {
      if (!glnNumber) return Promise.resolve([] as number[])
      return fetchHourlyTariff(glnNumber)
    },
    enabled: glnNumber !== null,
    staleTime: 1000 * 60 * 60 * 24, // tariffs update at most once a day
  })
}
