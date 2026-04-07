/**
 * Year-keyed public electricity fee schedules (DKK/kWh, ex VAT).
 * To update for a new year, add an entry to PUBLIC_FEE_SCHEDULES.
 *
 * Sources:
 *   Elafgift (state duty):           https://www.skat.dk/
 *   Energinet system/net tariff:     https://energinet.dk/tariffer
 */

export type PublicFeeSchedule = {
	/** State electricity duty — elafgift. */
	elafgift: number;
	/** Energinet system tariff — systemtarif. */
	systemTariff: number;
	/** Energinet national transmission tariff — nettarif. */
	transmissionTariff: number;
	/** Optional supplier markup — 0 when not applicable. */
	supplierMarkup: number;
};

/** Add a new entry here each year when Energinet publishes updated tariffs. */
export const PUBLIC_FEE_SCHEDULES: Record<number, PublicFeeSchedule> = {
	2026: {
		elafgift: 0.01,
		systemTariff: 0.06125,
		transmissionTariff: 0.05375,
		supplierMarkup: 0,
	},
};

/**
 * Returns the fee schedule for the requested year.
 * Falls back to the most recently defined year if no exact match exists.
 */
export function getFeeSchedule(year: number): PublicFeeSchedule {
	if (PUBLIC_FEE_SCHEDULES[year]) return PUBLIC_FEE_SCHEDULES[year];
	const latest = Math.max(...Object.keys(PUBLIC_FEE_SCHEDULES).map(Number));
	return PUBLIC_FEE_SCHEDULES[latest];
}

/** Sums all per-kWh fee components in a schedule. */
export function sumFeeSchedule(schedule: PublicFeeSchedule): number {
	return (
		schedule.elafgift +
		schedule.systemTariff +
		schedule.transmissionTariff +
		schedule.supplierMarkup
	);
}
