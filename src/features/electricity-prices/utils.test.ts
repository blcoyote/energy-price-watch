import { describe, expect, it } from "vitest";
import { getFeeSchedule, PUBLIC_FEE_SCHEDULES } from "./publicFees";
import type { DayAheadPrice } from "./types";
import {
	composeConsumerPrice,
	DK_VAT_RATE,
	getPublicFeesExVatPerKwh,
	toConsumerPrice,
	toElectricityChartData,
	toKwh,
} from "./utils";

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

// ── VAT helpers ─────────────────────────────────────────────────────────────

describe("toConsumerPrice", () => {
	it("applies Danish VAT by default", () => {
		expect(toConsumerPrice(1)).toBe(1.25);
		expect(toConsumerPrice(0.5)).toBe(0.63);
	});

	it("supports a custom VAT rate", () => {
		expect(toConsumerPrice(1, 0.1)).toBe(1.1);
	});

	it("handles negative values", () => {
		expect(toConsumerPrice(-0.5)).toBe(-0.63);
	});
});

describe("composeConsumerPrice", () => {
	it("composes spot, tariff and total as VAT-inclusive consumer prices", () => {
		const result = composeConsumerPrice(500, 0.1, 0); // 0.5 + 0.1 ex VAT per kWh

		expect(result.spotDKK).toBe(0.63);
		expect(result.tariffDKK).toBe(0.13);
		expect(result.totalDKK).toBe(0.76);
	});

	it("includes default public fees in the tariff component", () => {
		const result = composeConsumerPrice(41.1, 0.15237); // 0.04110 spot + 0.15237 local tariff ex VAT

		expect(result.spotDKK).toBe(0.05);
		expect(result.tariffDKK).toBe(0.35);
		expect(result.totalDKK).toBe(0.4);
	});

	it("keeps total equal to shown component sum", () => {
		const result = composeConsumerPrice(333.33, 0.07, 0);

		expect(result.totalDKK).toBe(result.spotDKK + result.tariffDKK);
	});

	it("uses the project VAT constant", () => {
		expect(DK_VAT_RATE).toBe(0.25);
	});

	it("returns the expected 2026 public fees sum ex VAT", () => {
		expect(getPublicFeesExVatPerKwh(2026)).toBeCloseTo(0.125, 6);
	});

	it("falls back to the latest schedule for an unknown year", () => {
		expect(getPublicFeesExVatPerKwh(2099)).toBeCloseTo(0.125, 6);
	});
});

// ── publicFees ───────────────────────────────────────────────────────────────

describe("getFeeSchedule", () => {
	it("returns 2026 elafgift 0.01", () => {
		expect(getFeeSchedule(2026).elafgift).toBe(0.01);
	});

	it("has the 2026 schedule defined", () => {
		expect(PUBLIC_FEE_SCHEDULES[2026]).toBeDefined();
	});

	it("falls back to latest year when requested year is missing", () => {
		const latest = Math.max(...Object.keys(PUBLIC_FEE_SCHEDULES).map(Number));
		expect(getFeeSchedule(2099)).toEqual(PUBLIC_FEE_SCHEDULES[latest]);
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
