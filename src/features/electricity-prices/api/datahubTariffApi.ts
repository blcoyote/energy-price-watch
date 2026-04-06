import { ApiError } from "@shared/api/errors";
import type { TariffRecord } from "../types";

const API_BASE = "https://api.energidataservice.dk";

type DatahubResponse = {
	total: number;
	records: TariffRecord[];
};

/** Extract the price for a given 0-based hour (0 = 00:00–01:00 DK). Falls back to Price1 for flat-rate rows.
 * Exported for testing. */
export function getHourPrice(record: TariffRecord, hour: number): number {
	const key = `Price${hour + 1}` as keyof TariffRecord;
	const val = record[key];
	if (typeof val === "number") return val;
	return typeof record.Price1 === "number" ? record.Price1 : 0;
}

/**
 * Fetches current D03 (hourly tariff) rows for a DSO identified by GLN number.
 * Returns a 24-element array of total DKK/kWh tariff indexed by DK hour-of-day (0=00:00).
 * Multiple ChargeTypeCodes from the same DSO are summed (they represent separate tariff components).
 */
export async function fetchHourlyTariff(glnNumber: string): Promise<number[]> {
	const url = new URL(`${API_BASE}/dataset/DatahubPricelist`);
	url.searchParams.set("start", "StartOfMonth-P6M");
	url.searchParams.set("end", "now");
	url.searchParams.set(
		"filter",
		JSON.stringify({ GLN_Number: [glnNumber], ChargeType: ["D03"] }),
	);
	url.searchParams.set("sort", "ValidFrom DESC");
	url.searchParams.set("limit", "100");

	const res = await fetch(url.toString());
	if (!res.ok) throw new ApiError(res.status, await res.text());

	const body = (await res.json()) as DatahubResponse;
	const todayStr = new Date().toISOString().slice(0, 10);

	// Keep only the latest active row per ChargeTypeCode (records are sorted ValidFrom DESC)
	const latestByCode = new Map<string, TariffRecord>();
	for (const record of body.records) {
		const expired = record.ValidTo !== null && record.ValidTo < todayStr;
		if (!expired && !latestByCode.has(record.ChargeTypeCode)) {
			latestByCode.set(record.ChargeTypeCode, record);
		}
	}

	// Sum all active tariff components hour by hour
	const hourly = Array<number>(24).fill(0);
	for (const record of latestByCode.values()) {
		for (let h = 0; h < 24; h++) {
			hourly[h] =
				Math.round((hourly[h] + getHourPrice(record, h)) * 10000) / 10000;
		}
	}

	return hourly;
}
