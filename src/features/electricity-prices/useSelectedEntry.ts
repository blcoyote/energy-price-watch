import { useEffect, useRef, useState } from "react";
import type { SelectedPriceEntry } from "./components/ElectricityPriceChart";
import type { ElectricityPriceChartPoint } from "./utils";
import { toKwh } from "./utils";

type Params = {
	data: ElectricityPriceChartPoint[] | undefined;
	tariffData: number[] | null | undefined;
	currentDkHour: number | undefined;
	showTomorrow: boolean;
};

type Result = {
	selectedEntry: SelectedPriceEntry | null;
	setSelectedEntry: (entry: SelectedPriceEntry | null) => void;
	liveTotal: number;
};

export function useSelectedEntry({
	data,
	tariffData,
	currentDkHour,
	showTomorrow,
}: Params): Result {
	const [selectedEntry, setSelectedEntry] = useState<SelectedPriceEntry | null>(
		null,
	);
	const initialised = useRef(false);
	const lastShowTomorrow = useRef(showTomorrow);

	useEffect(() => {
		if (lastShowTomorrow.current !== showTomorrow) {
			lastShowTomorrow.current = showTomorrow;
			initialised.current = false;
			setSelectedEntry(null);
		}
		if (initialised.current) return;
		if (!data || data.length === 0) return;
		if (currentDkHour == null) return;

		const defaultEntry = data.find(
			(d) => parseInt(d.timestamp.slice(11, 13), 10) === currentDkHour,
		);
		if (defaultEntry) {
			initialised.current = true;
			const tariffVal =
				tariffData != null ? (tariffData[currentDkHour] ?? 0) : 0;
			const spot = toKwh(defaultEntry.priceDKK);
			setSelectedEntry({
				time: defaultEntry.time,
				timestamp: defaultEntry.timestamp,
				spotDKK: spot,
				tariffDKK: tariffVal,
				totalDKK: Math.round((spot + tariffVal) * 100) / 100,
			});
		}
	}, [data, tariffData, currentDkHour, showTomorrow]);

	const priceBoxHour = selectedEntry
		? parseInt(selectedEntry.timestamp.slice(11, 13), 10)
		: 0;
	const liveTariff =
		selectedEntry && tariffData != null ? (tariffData[priceBoxHour] ?? 0) : 0;
	const liveTotal = selectedEntry
		? Math.round((selectedEntry.spotDKK + liveTariff) * 100) / 100
		: 0;

	return { selectedEntry, setSelectedEntry, liveTotal };
}
