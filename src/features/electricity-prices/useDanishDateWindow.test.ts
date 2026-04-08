import { describe, expect, it } from "vitest";
import { computeDateWindowFromDate } from "./useDanishDateWindow";

/**
 * Construct a Date that corresponds to a specific Danish clock time on 2026-04-06.
 * April 2026 is CEST (UTC+2), so DK 12:00 = UTC 10:00.
 * Uses Date.UTC() arithmetic to safely handle hours before 02:00 DK.
 */
function dkTime(hour: number, minute = 0): Date {
	const DK_OFFSET_HOURS = 2; // CEST = UTC+2
	// Days since Unix epoch for 2026-04-06 UTC midnight
	const dayMs = Date.UTC(2026, 3, 6); // month is 0-indexed
	return new Date(
		dayMs + (hour - DK_OFFSET_HOURS) * 3_600_000 + minute * 60_000,
	);
}

describe("computeDateWindowFromDate", () => {
	it("shows today when DK hour is before 13:00", () => {
		const result = computeDateWindowFromDate(dkTime(12));
		expect(result.tomorrowAvailable).toBe(false);
		expect(result.tomorrowNavVisible).toBe(false);
		expect(result.displayDay).toBe("2026-04-06");
		expect(result.start).toBe("2026-04-06");
		expect(result.end).toBe("2026-04-07");
		expect(result.currentDkHour).toBe(12);
		expect(result.currentDkHour).not.toBeUndefined();
	});

	it("shows tomorrow when DK hour is exactly 13:00 but nav is hidden", () => {
		const result = computeDateWindowFromDate(dkTime(13));
		expect(result.tomorrowAvailable).toBe(true);
		expect(result.tomorrowNavVisible).toBe(false);
		expect(result.displayDay).toBe("2026-04-07");
		expect(result.start).toBe("2026-04-07");
		expect(result.end).toBe("2026-04-08");
		expect(result.currentDkHour).toBeUndefined();
	});

	it("shows nav buttons when DK hour is exactly 14:00", () => {
		const result = computeDateWindowFromDate(dkTime(14));
		expect(result.tomorrowAvailable).toBe(true);
		expect(result.tomorrowNavVisible).toBe(true);
	});

	it("shows tomorrow for any hour >= 13", () => {
		for (const hour of [13, 14, 17, 20, 23]) {
			const result = computeDateWindowFromDate(dkTime(hour));
			expect(result.tomorrowAvailable).toBe(true);
		}
	});

	it("shows nav buttons for any hour >= 14", () => {
		for (const hour of [14, 17, 20, 23]) {
			const result = computeDateWindowFromDate(dkTime(hour));
			expect(result.tomorrowNavVisible).toBe(true);
		}
	});

	it("always populates today as the current-day fallback", () => {
		// Before 13:00 — today and the today field are the same
		const before = computeDateWindowFromDate(dkTime(10));
		expect(before.today.start).toBe("2026-04-06");
		expect(before.today.end).toBe("2026-04-07");
		expect(before.today.currentDkHour).toBe(10);

		// After 13:00 — today field still holds today even though main window is tomorrow
		const after = computeDateWindowFromDate(dkTime(14));
		expect(after.today.start).toBe("2026-04-06");
		expect(after.today.end).toBe("2026-04-07");
		expect(after.today.currentDkHour).toBe(14);
	});

	it("produces correct dates at midnight (hour 0)", () => {
		const result = computeDateWindowFromDate(dkTime(0));
		expect(result.tomorrowAvailable).toBe(false);
		expect(result.currentDkHour).toBe(0);
		expect(result.displayDay).toBe("2026-04-06");
	});

	it("advances the date correctly across day boundaries", () => {
		// Test a date that would naturally be in another month
		// 2026-04-30 UTC+2 12:00 = UTC 10:00
		const result = computeDateWindowFromDate(new Date("2026-04-30T10:00:00Z"));
		expect(result.displayDay).toBe("2026-04-30");
		expect(result.today.end).toBe("2026-05-01");
	});
});
