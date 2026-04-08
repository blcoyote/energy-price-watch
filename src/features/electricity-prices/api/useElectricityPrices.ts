import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { DayAheadPrice, DayAheadPricesQueryParams } from "../types";
import type { ElectricityPriceChartPoint } from "../utils";
import { toElectricityChartData } from "../utils";
import { fetchElectricityPrices } from "./electricityPricesApi";
import { fetchEurToDkkRate } from "./exchangeRateApi";
import { electricityPriceKeys } from "./queryKeys";

function needsEurFallback(records: DayAheadPrice[]): boolean {
	return (
		records.length > 0 && records.every((r) => r.DayAheadPriceDKK === null)
	);
}

export function useElectricityPrices(
	params: DayAheadPricesQueryParams,
	options?: { enabled?: boolean },
): UseQueryResult<ElectricityPriceChartPoint[], Error> {
	const pricesQuery = useQuery({
		queryKey: electricityPriceKeys.list(params),
		queryFn: () => fetchElectricityPrices(params),
		refetchInterval: 60 * 60 * 1000, // refetch every hour
		enabled: options?.enabled ?? true,
	});

	const eurFallbackNeeded = needsEurFallback(pricesQuery.data ?? []);

	const rateQuery = useQuery({
		queryKey: electricityPriceKeys.exchangeRate(),
		queryFn: fetchEurToDkkRate,
		enabled: eurFallbackNeeded,
		staleTime: 1000 * 60 * 60, // exchange rate is good for an hour
	});

	// Re-expose as a combined query result: pending until both are ready when needed
	const data =
		pricesQuery.data !== undefined
			? toElectricityChartData(
					pricesQuery.data,
					eurFallbackNeeded ? rateQuery.data : undefined,
				)
			: undefined;

	return {
		...pricesQuery,
		data,
		isPending:
			pricesQuery.isPending || (eurFallbackNeeded && rateQuery.isPending),
		isLoading:
			pricesQuery.isLoading || (eurFallbackNeeded && rateQuery.isLoading),
		isError: pricesQuery.isError || (eurFallbackNeeded && rateQuery.isError),
		error: pricesQuery.error ?? (eurFallbackNeeded ? rateQuery.error : null),
	} as unknown as UseQueryResult<ElectricityPriceChartPoint[], Error>;
}
