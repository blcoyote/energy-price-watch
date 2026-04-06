import { afterEach, describe, expect, it, vi } from "vitest";
import type { DayAheadPrice } from "../types";
import { fetchElectricityPrices } from "./electricityPricesApi";

function mockFetch(records: DayAheadPrice[], ok = true) {
	return vi.spyOn(globalThis, "fetch").mockResolvedValue({
		ok,
		status: ok ? 200 : 500,
		json: async () => ({
			total: records.length,
			limit: 100,
			dataset: "DayAheadPrices",
			records,
		}),
		text: async () => "Server Error",
	} as Response);
}

const baseParams = {
	priceArea: "DK1" as const,
	start: "2026-04-06",
	end: "2026-04-07",
};

const sampleRecord: DayAheadPrice = {
	TimeUTC: "2026-04-06T12:00:00",
	TimeDK: "2026-04-06T14:00:00",
	PriceArea: "DK1",
	DayAheadPriceEUR: 85,
	DayAheadPriceDKK: 634,
};

afterEach(() => vi.restoreAllMocks());

describe("fetchElectricityPrices", () => {
	it("returns the records array from the response", async () => {
		mockFetch([sampleRecord]);
		const result = await fetchElectricityPrices(baseParams);
		expect(result).toEqual([sampleRecord]);
	});

	it("returns an empty array when records is empty", async () => {
		mockFetch([]);
		const result = await fetchElectricityPrices(baseParams);
		expect(result).toEqual([]);
	});

	it("builds the correct URL and passes query params", async () => {
		const spy = mockFetch([]);
		await fetchElectricityPrices({
			priceArea: "DK2",
			start: "2026-04-06",
			end: "2026-04-07",
		});

		const url = new URL(spy.mock.calls[0][0] as string);
		expect(url.pathname).toBe("/dataset/DayAheadPrices");
		expect(url.searchParams.get("start")).toBe("2026-04-06");
		expect(url.searchParams.get("end")).toBe("2026-04-07");
		expect(url.searchParams.get("filter")).toContain("DK2");
		expect(url.searchParams.get("sort")).toBe("TimeUTC asc");
	});

	it("passes limit param when provided", async () => {
		const spy = mockFetch([]);
		await fetchElectricityPrices({ ...baseParams, limit: 50 });

		const url = new URL(spy.mock.calls[0][0] as string);
		expect(url.searchParams.get("limit")).toBe("50");
	});

	it("does not pass limit param when omitted", async () => {
		const spy = mockFetch([]);
		await fetchElectricityPrices(baseParams);

		const url = new URL(spy.mock.calls[0][0] as string);
		expect(url.searchParams.has("limit")).toBe(false);
	});

	it("throws ApiError when the response is not ok", async () => {
		mockFetch([], false);
		await expect(fetchElectricityPrices(baseParams)).rejects.toThrow(
			"Server Error",
		);
	});
});
