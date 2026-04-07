import { type ReactElement, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../ui/icons";
import { useElectricityPrices } from "../api/useElectricityPrices";
import { useElectricityTariff } from "../api/useElectricityTariff";
import type { DayAheadPricesQueryParams } from "../types";
import { GRID_COMPANIES } from "../types";
import { useDanishDateWindow } from "../useDanishDateWindow";
import { useSelectedEntry } from "../useSelectedEntry";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import { ElectricityPriceChart } from "./ElectricityPriceChart";
import { PriceControls } from "./PriceControls";

export function ElectricityPricesPanel(): ReactElement {
	const [priceArea, setPriceArea] = useLocalStorage<"DK1" | "DK2">(
		"epw:price-area",
		"DK1",
	);
	const [includeTariff, setIncludeTariff] = useLocalStorage(
		"epw:include-tariff",
		true,
	);
	const [showTomorrow, setShowTomorrow] = useState(false);

	const areaGln =
		GRID_COMPANIES.find((c) => c.area === priceArea)?.gln ??
		GRID_COMPANIES[0].gln;

	const { start, end, displayDay, tomorrowAvailable, today } =
		useDanishDateWindow();

	const todayParams: DayAheadPricesQueryParams = {
		priceArea,
		start: today.start,
		end: today.end,
	};
	const tomorrowParams: DayAheadPricesQueryParams = { priceArea, start, end };

	const {
		data: todayData,
		isPending: todayPending,
		isError,
		error,
	} = useElectricityPrices(todayParams);
	const { data: tomorrowData, isPending: tomorrowPending } =
		useElectricityPrices(tomorrowParams, { enabled: tomorrowAvailable });

	const usingTomorrow = showTomorrow && tomorrowAvailable;
	const data = usingTomorrow ? tomorrowData : todayData;
	const currentDkHour = usingTomorrow ? undefined : today.currentDkHour;
	const isPending = usingTomorrow ? tomorrowPending : todayPending;
	const activeDisplayDay = usingTomorrow ? displayDay : today.start;

	const { data: tariffData, isPending: tariffPending } = useElectricityTariff(
		includeTariff ? areaGln : null,
	);

	const chartWrapperRef = useRef<HTMLDivElement>(null);

	const { selectedEntry, setSelectedEntry, liveTotal } = useSelectedEntry({
		data,
		tariffData,
		currentDkHour,
		showTomorrow,
	});

	useEffect(() => {
		function handleOutside(e: MouseEvent | TouchEvent) {
			if (
				chartWrapperRef.current &&
				!chartWrapperRef.current.contains(e.target as Node)
			) {
				// Dismiss the Recharts tooltip by simulating a mouse-leave on its
				// wrapper. This keeps selectedEntry (and the controls price box) alive.
				const rechartsWrapper =
					chartWrapperRef.current.querySelector(".recharts-wrapper");
				rechartsWrapper?.dispatchEvent(
					new MouseEvent("mouseleave", { bubbles: true }),
				);
			}
		}
		document.addEventListener("mousedown", handleOutside);
		document.addEventListener("touchstart", handleOutside, { passive: true });
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			document.removeEventListener("touchstart", handleOutside);
		};
	}, []);

	const headingLabel = usingTomorrow
		? `I morgen — ${activeDisplayDay}`
		: `I dag — ${activeDisplayDay}`;
	const subLabel = usingTomorrow
		? "Kommende day-ahead priser (offentliggjort efter kl. 13:00)"
		: "Morgendagens priser frigives mellem kl. 13.00 og 14.00";

	return (
		<section className="prices-panel">
			<div className="prices-header">
				<h1 className="prices-title">⚡ Day-ahead priser · {headingLabel}</h1>
				<p className="prices-subtitle">{subLabel}</p>
			</div>

			<PriceControls
				priceArea={priceArea}
				onPriceAreaChange={setPriceArea}
				includeTariff={includeTariff}
				onIncludeTariffChange={setIncludeTariff}
				selectedEntry={selectedEntry}
				liveTotal={liveTotal}
			/>

			{isPending && <p className="status-msg">Henter priser…</p>}
			{includeTariff && tariffPending && (
				<p className="status-msg">Henter tariffer…</p>
			)}
			{isError && (
				<p className="status-msg status-error">
					Kunne ikke hente priser:{" "}
					{error instanceof Error ? error.message : "Ukendt fejl"}
				</p>
			)}
			{data && data.length === 0 && (
				<p className="status-msg">
					Ingen data tilgængeligt for den valgte periode.
				</p>
			)}

			{data && data.length > 0 && (
				<div className="chart-wrapper" ref={chartWrapperRef}>
					{tomorrowAvailable && (
						<div className="chart-nav">
							<button
								type="button"
								className="chart-nav-btn"
								disabled={!showTomorrow}
								aria-label="Vis i dag"
								onClick={() => setShowTomorrow(false)}
							>
								<ChevronLeftIcon />
							</button>
							<span className="chart-nav-label">
								{usingTomorrow ? "I morgen" : "I dag"}
							</span>
							<button
								type="button"
								className="chart-nav-btn"
								disabled={showTomorrow}
								aria-label="Vis i morgen"
								onClick={() => setShowTomorrow(true)}
							>
								<ChevronRightIcon />
							</button>
						</div>
					)}
					<ElectricityPriceChart
						data={data}
						tariff={includeTariff ? tariffData : undefined}
						currentDkHour={currentDkHour}
						selectedTimestamp={selectedEntry?.timestamp}
						onBarClick={setSelectedEntry}
					/>
				</div>
			)}
		</section>
	);
}
