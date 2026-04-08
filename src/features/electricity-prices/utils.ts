import { getFeeSchedule, sumFeeSchedule } from "./publicFees";
import type { DayAheadPrice } from "./types";

export const DK_VAT_RATE = 0.25;

export type ConsumerPriceBreakdown = {
	spotDKK: number;
	tariffDKK: number;
	totalDKK: number;
};

/**
 * Returns the total public electricity fees (DKK/kWh, ex VAT) for the given year.
 * Defaults to the current calendar year; falls back to the most recent known schedule.
 */
export function getPublicFeesExVatPerKwh(
	year = new Date().getFullYear(),
): number {
	return sumFeeSchedule(getFeeSchedule(year));
}

export type ElectricityPriceChartPoint = {
	// Local Danish time formatted for display (e.g. "14:00")
	time: string;
	// Full ISO timestamp of the hour (used as unique chart key)
	timestamp: string;
	priceEUR: number;
	priceDKK: number;
};

/**
 * Aggregates 15-minute DayAheadPrices records into hourly averages.
 * Records belonging to the same clock-hour (per Danish local time) are averaged.
 * When `DayAheadPriceDKK` is null, `eurToDkkRate` is used to convert from EUR.
 */
export function toElectricityChartData(
	records: DayAheadPrice[],
	eurToDkkRate?: number,
): ElectricityPriceChartPoint[] {
	// Group by the hour portion of TimeDK (e.g. "2026-04-06T14")
	const hourMap = new Map<
		string,
		{ sumEUR: number; sumDKK: number; count: number; timeDK: string }
	>();

	for (const r of records) {
		const dkk =
			r.DayAheadPriceDKK ??
			(eurToDkkRate !== undefined ? r.DayAheadPriceEUR * eurToDkkRate : 0);
		const hourKey = r.TimeDK.slice(0, 13); // "YYYY-MM-DDTHH"
		const existing = hourMap.get(hourKey);
		if (existing) {
			existing.sumEUR += r.DayAheadPriceEUR;
			existing.sumDKK += dkk;
			existing.count += 1;
		} else {
			hourMap.set(hourKey, {
				sumEUR: r.DayAheadPriceEUR,
				sumDKK: dkk,
				count: 1,
				timeDK: r.TimeDK,
			});
		}
	}

	return Array.from(hourMap.values()).map(
		({ sumEUR, sumDKK, count, timeDK }) => ({
			// Extract HH:mm directly from the TimeDK string — avoids timezone issues in tests
			time: `${timeDK.slice(11, 16)}`,
			timestamp: timeDK,
			priceEUR: Math.round((sumEUR / count) * 100) / 100,
			priceDKK: Math.round((sumDKK / count) * 100) / 100,
		}),
	);
}

function roundTo2(value: number): number {
	return Math.sign(value) * (Math.round(Math.abs(value) * 100) / 100);
}

/** Apply Danish VAT and return a consumer-facing DKK/kWh price. */
export function toConsumerPrice(
	valueExVat: number,
	vatRate = DK_VAT_RATE,
): number {
	return roundTo2(valueExVat * (1 + vatRate));
}

/**
 * Compose consumer-facing prices from raw inputs.
 * Spot input is DKK/MWh from DayAheadPrices; tariff is DKK/kWh.
 */
export function composeConsumerPrice(
	spotMwhDKK: number,
	tariffKwhDKK = 0,
	extraKwhDKK = getPublicFeesExVatPerKwh(),
): ConsumerPriceBreakdown {
	const spotExVat = spotMwhDKK / 1000;
	const spotDKK = toConsumerPrice(spotExVat);
	const tariffDKK = toConsumerPrice(tariffKwhDKK + extraKwhDKK);
	return {
		spotDKK,
		tariffDKK,
		totalDKK: roundTo2(spotDKK + tariffDKK),
	};
}

/** Convert MWh price → kWh price, rounded to 2 decimal places. */
export function toKwh(mwhPrice: number): number {
	return roundTo2(mwhPrice / 1000);
}
