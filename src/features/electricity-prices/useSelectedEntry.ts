import { useEffect, useRef, useState } from "react";
import type { SelectedPriceEntry } from "./types";
import type { ElectricityPriceChartPoint } from "./utils";
import { composeConsumerPrice } from "./utils";

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
			const tariffValExVat =
				tariffData != null ? (tariffData[currentDkHour] ?? 0) : 0;
			const extraFeesExVat = tariffData != null ? undefined : 0;
			const prices = composeConsumerPrice(
				defaultEntry.priceDKK,
				tariffValExVat,
				extraFeesExVat,
			);
			setSelectedEntry({
				time: defaultEntry.time,
				timestamp: defaultEntry.timestamp,
				spotMwhDKK: defaultEntry.priceDKK,
				spotDKK: prices.spotDKK,
				tariffDKK: prices.tariffDKK,
				totalDKK: prices.totalDKK,
			});
		}
	}, [data, tariffData, currentDkHour, showTomorrow]);

	const priceBoxHour = selectedEntry
		? parseInt(selectedEntry.timestamp.slice(11, 13), 10)
		: 0;
	const liveTariffExVat =
		selectedEntry && tariffData != null ? (tariffData[priceBoxHour] ?? 0) : 0;
	const liveExtraFeesExVat = tariffData != null ? undefined : 0;
	const liveTotal = selectedEntry
		? composeConsumerPrice(
				selectedEntry.spotMwhDKK,
				liveTariffExVat,
				liveExtraFeesExVat,
			).totalDKK
		: 0;

	return { selectedEntry, setSelectedEntry, liveTotal };
}
