import { ApiError } from "@shared/api/errors";
import type {
	DayAheadPrice,
	DayAheadPricesQueryParams,
	DayAheadPricesResponse,
} from "../types";

const API_BASE = "https://api.energidataservice.dk";

export async function fetchElectricityPrices(
	params: DayAheadPricesQueryParams,
): Promise<DayAheadPrice[]> {
	const url = new URL(`${API_BASE}/dataset/DayAheadPrices`);
	url.searchParams.set("start", params.start);
	url.searchParams.set("end", params.end);
	url.searchParams.set(
		"filter",
		JSON.stringify({ PriceArea: [params.priceArea] }),
	);
	url.searchParams.set("sort", "TimeUTC asc");
	if (params.limit !== undefined) {
		url.searchParams.set("limit", String(params.limit));
	}

	const res = await fetch(url.toString());
	if (!res.ok) throw new ApiError(res.status, await res.text());

	const body = (await res.json()) as DayAheadPricesResponse;
	return body.records;
}
