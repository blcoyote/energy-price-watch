import { useEffect, useState } from "react";

export type DateWindow = {
	start: string;
	end: string;
	displayDay: string;
	tomorrowAvailable: boolean;
	/** Whether the day-navigation buttons should be shown (DK hour >= 14). */
	tomorrowNavVisible: boolean;
	/** Current Danish hour (0-23), or undefined when showing tomorrow's prices. */
	currentDkHour: number | undefined;
	/** Today's date range, always available as a fallback. */
	today: { start: string; end: string; currentDkHour: number };
};

/**
 * Pure function: computes the date window from a given point in time.
 * Exported for testing.
 */
export function computeDateWindowFromDate(now: Date): DateWindow {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Copenhagen",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		hour12: false,
	}).formatToParts(now);

	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
	const todayStr = `${get("year")}-${get("month")}-${get("day")}`;
	const dkHour = parseInt(get("hour"), 10);

	const todayUTC = new Date(`${todayStr}T00:00:00Z`);
	const tomorrowStr = new Date(todayUTC.getTime() + 864e5)
		.toISOString()
		.slice(0, 10);
	const dayAfterStr = new Date(todayUTC.getTime() + 2 * 864e5)
		.toISOString()
		.slice(0, 10);

	// Next-day prices are published by Nord Pool around 12:00–13:00 DK time
	const tomorrowAvailable = dkHour >= 13;
	// Navigation buttons are only shown from 14:00 to avoid showing incomplete data
	const tomorrowNavVisible = dkHour >= 14;

	return tomorrowAvailable
		? {
				start: tomorrowStr,
				end: dayAfterStr,
				displayDay: tomorrowStr,
				tomorrowAvailable: true,
				tomorrowNavVisible,
				currentDkHour: undefined,
				today: { start: todayStr, end: tomorrowStr, currentDkHour: dkHour },
			}
		: {
				start: todayStr,
				end: tomorrowStr,
				displayDay: todayStr,
				tomorrowAvailable: false,
				tomorrowNavVisible: false,
				currentDkHour: dkHour,
				today: { start: todayStr, end: tomorrowStr, currentDkHour: dkHour },
			};
}

/** Tracks the current Danish date window and refreshes automatically on each hour boundary. */
export function useDanishDateWindow(): DateWindow {
	const [dateWindow, setDateWindow] = useState(() =>
		computeDateWindowFromDate(new Date()),
	);

	useEffect(() => {
		function scheduleHourlyRefresh() {
			const now = new Date();
			const msUntilNextHour =
				(60 - now.getMinutes()) * 60 * 1000 -
				now.getSeconds() * 1000 -
				now.getMilliseconds();

			let interval: ReturnType<typeof setInterval> | undefined;

			const timeout = setTimeout(() => {
				setDateWindow(computeDateWindowFromDate(new Date()));
				interval = setInterval(
					() => setDateWindow(computeDateWindowFromDate(new Date())),
					60 * 60 * 1000,
				);
			}, msUntilNextHour);

			return () => {
				clearTimeout(timeout);
				clearInterval(interval);
			};
		}

		let cleanup = scheduleHourlyRefresh();

		function handleVisibilityChange() {
			if (document.visibilityState === "visible") {
				setDateWindow(computeDateWindowFromDate(new Date()));
				cleanup();
				cleanup = scheduleHourlyRefresh();
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			cleanup();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	return dateWindow;
}
