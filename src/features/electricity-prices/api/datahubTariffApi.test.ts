import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TariffRecord } from "../types";
import {
	fetchHourlyTariff,
	getHourPrice,
	pickConsumerTariffRecord,
} from "./datahubTariffApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<TariffRecord> = {}): TariffRecord {
	const base: TariffRecord = {
		ChargeOwner: "Test DSO",
		GLN_Number: "5790001089030",
		ChargeType: "D03",
		ChargeTypeCode: "CD_A",
		ValidFrom: "2026-01-01",
		ValidTo: null,
		Price1: 0.1,
		Price2: 0.1,
		Price3: 0.1,
		Price4: 0.1,
		Price5: 0.1,
		Price6: 0.1,
		Price7: 0.1,
		Price8: 0.1,
		Price9: 0.1,
		Price10: 0.1,
		Price11: 0.1,
		Price12: 0.1,
		Price13: 0.2,
		Price14: 0.2,
		Price15: 0.2,
		Price16: 0.2,
		Price17: 0.3,
		Price18: 0.3,
		Price19: 0.3,
		Price20: 0.2,
		Price21: 0.1,
		Price22: 0.1,
		Price23: 0.1,
		Price24: 0.1,
		ResolutionDuration: "PT1H",
	};
	return { ...base, ...overrides };
}

function mockFetch(records: TariffRecord[]) {
	return vi.spyOn(globalThis, "fetch").mockResolvedValue({
		ok: true,
		json: async () => ({ total: records.length, records }),
	} as Response);
}

// ── getHourPrice ───────────────────────────────────────────────────────────

describe("getHourPrice", () => {
	it("returns the numbered price for a given 0-based hour", () => {
		const record = makeRecord({ Price1: 0.1, Price13: 0.25 });
		expect(getHourPrice(record, 0)).toBe(0.1); // hour 0 → Price1
		expect(getHourPrice(record, 12)).toBe(0.25); // hour 12 → Price13
	});

	it("falls back to Price1 when the specific hour is null", () => {
		const record = makeRecord({ Price1: 0.1, Price5: null });
		expect(getHourPrice(record, 4)).toBe(0.1); // Price5 null → Price1
	});

	it("returns 0 when both the specific price and Price1 are null", () => {
		const record = makeRecord({ Price1: null, Price3: null });
		expect(getHourPrice(record, 2)).toBe(0);
	});

	it("handles hour 23 (Price24)", () => {
		const record = makeRecord({ Price24: 0.99 });
		expect(getHourPrice(record, 23)).toBe(0.99);
	});
});

// ── fetchHourlyTariff ──────────────────────────────────────────────────────

describe("fetchHourlyTariff", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("returns a 24-element array", async () => {
		mockFetch([makeRecord()]);
		const result = await fetchHourlyTariff("5790001089030");
		expect(result).toHaveLength(24);
	});

	it("selects standard C tariff instead of summing multiple ChargeTypeCodes", async () => {
		vi.setSystemTime(new Date("2026-04-06T12:00:00Z"));
		const records = [
			makeRecord({
				ChargeTypeCode: "DT_B_02",
				Note: "Nettarif B lav",
				Price1: 0.05,
			}),
			makeRecord({
				ChargeTypeCode: "DT_C_01",
				Note: "Nettarif C",
				Price1: 0.1,
			}),
		];
		mockFetch(records);
		const result = await fetchHourlyTariff("5790001089030");
		expect(result[0]).toBeCloseTo(0.1, 4);
	});

	it("deduplicates by ChargeTypeCode, keeping the latest ValidFrom", async () => {
		vi.setSystemTime(new Date("2026-04-06T12:00:00Z"));
		// Records are sorted ValidFrom DESC — first one per code wins
		const records = [
			makeRecord({
				ChargeTypeCode: "CD_A",
				ValidFrom: "2026-03-01",
				Price1: 0.2,
			}),
			makeRecord({
				ChargeTypeCode: "CD_A",
				ValidFrom: "2026-01-01",
				Price1: 0.1,
			}),
		];
		mockFetch(records);
		const result = await fetchHourlyTariff("5790001089030");
		// Should use Price1=0.20 (latest), not sum both
		expect(result[0]).toBeCloseTo(0.2, 4);
	});

	it("filters out expired records (ValidTo in the past)", async () => {
		vi.setSystemTime(new Date("2026-04-06T12:00:00Z"));
		const records = [
			makeRecord({
				ChargeTypeCode: "DT_C_01",
				Note: "Nettarif C",
				ValidTo: "2026-01-01",
				Price1: 0.99,
			}), // expired
			makeRecord({
				ChargeTypeCode: "DT_B_02",
				Note: "Nettarif B lav",
				ValidTo: null,
				Price1: 0.05,
			}), // active fallback
		];
		mockFetch(records);
		const result = await fetchHourlyTariff("5790001089030");
		expect(result[0]).toBeCloseTo(0.05, 4);
	});

	it("treats ValidTo on current date as active", async () => {
		vi.setSystemTime(new Date("2026-04-06T12:00:00Z"));
		const records = [
			makeRecord({
				ChargeTypeCode: "DT_C_01",
				Note: "Nettarif C",
				ValidTo: "2026-04-06T00:00:00",
				Price1: 0.2,
			}),
			makeRecord({
				ChargeTypeCode: "DT_B_02",
				Note: "Nettarif B lav",
				ValidTo: null,
				Price1: 0.05,
			}),
		];
		mockFetch(records);
		const result = await fetchHourlyTariff("5790001089030");
		expect(result[0]).toBeCloseTo(0.2, 4);
	});

	it("returns all zeros when no active records exist", async () => {
		vi.setSystemTime(new Date("2026-04-06T12:00:00Z"));
		mockFetch([makeRecord({ ValidTo: "2026-01-01" })]);
		const result = await fetchHourlyTariff("5790001089030");
		expect(result.every((v) => v === 0)).toBe(true);
	});

	it("throws ApiError when the response is not ok", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: false,
			status: 500,
			text: async () => "Internal Server Error",
		} as Response);
		await expect(fetchHourlyTariff("bad-gln")).rejects.toThrow(
			"Internal Server Error",
		);
	});
});

describe("pickConsumerTariffRecord", () => {
	it("prefers standard C tariff over local collective variants", () => {
		const selected = pickConsumerTariffRecord([
			makeRecord({
				ChargeTypeCode: "31LK_C",
				Note: "Nettarif lokal kollektiv",
				Price1: 0.04,
			}),
			makeRecord({
				ChargeTypeCode: "DT_C_01",
				Note: "Nettarif C",
				Price1: 0.1,
			}),
		]);

		expect(selected?.ChargeTypeCode).toBe("DT_C_01");
	});
});
