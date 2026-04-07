import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { DayAheadPricesQueryParams } from "../types";
import type { ElectricityPriceChartPoint } from "../utils";
import { toElectricityChartData } from "../utils";
import { fetchElectricityPrices } from "./electricityPricesApi";
import { electricityPriceKeys } from "./queryKeys";

export function useElectricityPrices(
	params: DayAheadPricesQueryParams,
	options?: { enabled?: boolean },
): UseQueryResult<ElectricityPriceChartPoint[], Error> {
	return useQuery({
		queryKey: electricityPriceKeys.list(params),
		queryFn: () => fetchElectricityPrices(params),
		select: toElectricityChartData,
		refetchInterval: 60 * 60 * 1000, // refetch every hour
		enabled: options?.enabled ?? true,
	});
}
