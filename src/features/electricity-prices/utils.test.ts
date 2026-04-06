import { describe, expect, it } from "vitest";
import type { DayAheadPrice } from "./types";
import { toElectricityChartData, toKwh } from "./utils";

// ── toKwh ──────────────────────────────────────────────────────────────────

describe("toKwh", () => {
	it("divides MWh price by 1000", () => {
		expect(toKwh(1000)).toBe(1);
	});

	it("rounds to 2 decimal places", () => {
		expect(toKwh(123.456)).toBe(0.12);
		expect(toKwh(999)).toBe(1);
		expect(toKwh(1020)).toBe(1.02);
	});

	it("handles negative prices", () => {
		expect(toKwh(-500)).toBe(-0.5);
		expect(toKwh(-1234)).toBe(-1.23);
	});

	it("returns 0 for 0", () => {
		expect(toKwh(0)).toBe(0);
	});
});

// ── toElectricityChartData ─────────────────────────────────────────────────

function makeRecord(overrides: Partial<DayAheadPrice>): DayAheadPrice {
	return {
		TimeUTC: "2026-04-06T12:00:00",
		TimeDK: "2026-04-06T14:00:00",
		PriceArea: "DK1",
		DayAheadPriceEUR: 100,
		DayAheadPriceDKK: 750,
		...overrides,
	};
}

describe("toElectricityChartData", () => {
	it("returns empty array for empty input", () => {
		expect(toElectricityChartData([])).toEqual([]);
	});

	it("maps a single 15-min record to one chart point", () => {
		const records = [
			makeRecord({
				TimeDK: "2026-04-06T14:00:00",
				DayAheadPriceEUR: 80,
				DayAheadPriceDKK: 600,
			}),
		];
		const result = toElectricityChartData(records);

		expect(result).toHaveLength(1);
		expect(result[0].timestamp).toBe("2026-04-06T14:00:00");
		expect(result[0].time).toBe("14:00");
		expect(result[0].priceEUR).toBe(80);
		expect(result[0].priceDKK).toBe(600);
	});

	it("averages four 15-min records within the same hour", () => {
		const records = [
			makeRecord({
				TimeDK: "2026-04-06T14:00:00",
				DayAheadPriceEUR: 100,
				DayAheadPriceDKK: 700,
			}),
			makeRecord({
				TimeDK: "2026-04-06T14:15:00",
				DayAheadPriceEUR: 200,
				DayAheadPriceDKK: 800,
			}),
			makeRecord({
				TimeDK: "2026-04-06T14:30:00",
				DayAheadPriceEUR: 150,
				DayAheadPriceDKK: 750,
			}),
			makeRecord({
				TimeDK: "2026-04-06T14:45:00",
				DayAheadPriceEUR: 50,
				DayAheadPriceDKK: 650,
			}),
		];
		const result = toElectricityChartData(records);

		expect(result).toHaveLength(1);
		expect(result[0].priceEUR).toBe(125); // (100+200+150+50)/4
		expect(result[0].priceDKK).toBe(725); // (700+800+750+650)/4
		expect(result[0].timestamp).toBe("2026-04-06T14:00:00");
	});

	it("keeps records from different hours separate", () => {
		const records = [
			makeRecord({ TimeDK: "2026-04-06T13:00:00", DayAheadPriceDKK: 100 }),
			makeRecord({ TimeDK: "2026-04-06T13:15:00", DayAheadPriceDKK: 200 }),
			makeRecord({ TimeDK: "2026-04-06T14:00:00", DayAheadPriceDKK: 400 }),
			makeRecord({ TimeDK: "2026-04-06T14:15:00", DayAheadPriceDKK: 600 }),
		];
		const result = toElectricityChartData(records);

		expect(result).toHaveLength(2);
		expect(result[0].priceDKK).toBe(150); // avg(100,200)
		expect(result[1].priceDKK).toBe(500); // avg(400,600)
	});

	it("handles negative prices correctly", () => {
		const records = [
			makeRecord({
				TimeDK: "2026-04-06T02:00:00",
				DayAheadPriceDKK: -200,
				DayAheadPriceEUR: -20,
			}),
			makeRecord({
				TimeDK: "2026-04-06T02:15:00",
				DayAheadPriceDKK: -400,
				DayAheadPriceEUR: -40,
			}),
		];
		const result = toElectricityChartData(records);

		expect(result).toHaveLength(1);
		expect(result[0].priceDKK).toBe(-300);
		expect(result[0].priceEUR).toBe(-30);
	});

	it("rounds averages to 2 decimal places", () => {
		const records = [
			makeRecord({ TimeDK: "2026-04-06T10:00:00", DayAheadPriceDKK: 100 }),
			makeRecord({ TimeDK: "2026-04-06T10:15:00", DayAheadPriceDKK: 200 }),
			makeRecord({ TimeDK: "2026-04-06T10:30:00", DayAheadPriceDKK: 300 }),
		];
		const result = toElectricityChartData(records);

		expect(result[0].priceDKK).toBe(200); // (100+200+300)/3 = 200 exactly
	});

	it("uses the timestamp of the first record in the hour as the key", () => {
		const records = [
			makeRecord({ TimeDK: "2026-04-06T08:00:00" }),
			makeRecord({ TimeDK: "2026-04-06T08:30:00" }),
		];
		const result = toElectricityChartData(records);

		expect(result[0].timestamp).toBe("2026-04-06T08:00:00");
	});
});
