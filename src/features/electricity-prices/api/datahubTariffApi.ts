import { ApiError } from "@shared/api/errors";
import type { TariffRecord } from "../types";

const API_BASE = "https://api.energidataservice.dk";

type DatahubResponse = {
	total: number;
	records: TariffRecord[];
};

function roundTo4(value: number): number {
	return Math.round(value * 10000) / 10000;
}

function isExpired(record: TariffRecord, todayStr: string): boolean {
	if (record.ValidTo === null) return false;
	// Datahub data often uses date-only cutoffs; treat same-day ValidTo rows as active.
	return record.ValidTo.slice(0, 10) < todayStr;
}

function averageHourly(record: TariffRecord): number {
	let sum = 0;
	for (let h = 0; h < 24; h++) {
		sum += getHourPrice(record, h);
	}
	return sum / 24;
}

function tariffText(record: TariffRecord): string {
	return `${record.ChargeTypeCode} ${record.Note ?? ""} ${record.Description ?? ""}`.toLowerCase();
}

function isExcludedVariant(record: TariffRecord): boolean {
	const text = tariffText(record);
	return /(lokal kollektiv|samplacer|egenproducent|særtarif)/.test(text);
}

function isStandardConsumerC(record: TariffRecord): boolean {
	const text = tariffText(record);
	if (
		!/(dt_c|nettarif c|kundegruppe c|(^|[^a-z0-9])c([^a-z0-9]|$))/.test(text)
	) {
		return false;
	}
	return !isExcludedVariant(record);
}

/** Pick the single tariff product for a standard household (C tariff). */
export function pickConsumerTariffRecord(
	records: TariffRecord[],
): TariffRecord | null {
	const preferred = records.filter(isStandardConsumerC);
	if (preferred.length > 0) {
		return preferred[0];
	}

	const nonSpecial = records.filter((record) => !isExcludedVariant(record));
	if (nonSpecial.length > 0) {
		return nonSpecial.reduce((best, current) =>
			averageHourly(current) > averageHourly(best) ? current : best,
		);
	}

	return records[0] ?? null;
}

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
 * Returns a 24-element array of DKK/kWh tariff for a standard consumer (C tariff)
 * indexed by DK hour-of-day (0=00:00).
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
	url.searchParams.set("limit", "500");

	const res = await fetch(url.toString());
	if (!res.ok) throw new ApiError(res.status, await res.text());

	const body = (await res.json()) as DatahubResponse;
	const todayStr = new Date().toISOString().slice(0, 10);

	// Keep only the latest active hourly-energy row per ChargeTypeCode.
	// Exclude P1D rows — those are demand/capacity charges (DKK/kW), not per-kWh energy tariffs.
	const latestByCode = new Map<string, TariffRecord>();
	for (const record of body.records) {
		if (record.ResolutionDuration !== "PT1H") continue;
		const expired = isExpired(record, todayStr);
		if (!expired && !latestByCode.has(record.ChargeTypeCode)) {
			latestByCode.set(record.ChargeTypeCode, record);
		}
	}

	const selected = pickConsumerTariffRecord(Array.from(latestByCode.values()));
	const hourly = Array<number>(24).fill(0);
	if (selected == null) {
		return hourly;
	}

	for (let h = 0; h < 24; h++) {
		hourly[h] = roundTo4(getHourPrice(selected, h));
	}

	return hourly;
}
