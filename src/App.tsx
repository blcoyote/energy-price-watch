import type {
	DayAheadPricesQueryParams,
	SelectedPriceEntry,
} from "@features/electricity-prices";
import {
	ElectricityPriceChart,
	GRID_COMPANIES,
	toKwh,
	useDanishDateWindow,
	useElectricityPrices,
	useElectricityTariff,
} from "@features/electricity-prices";
import { useEffect, useRef, useState } from "react";
import "./App.css";

function SunIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="5" />
			<line x1="12" y1="1" x2="12" y2="3" />
			<line x1="12" y1="21" x2="12" y2="23" />
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
			<line x1="1" y1="12" x2="3" y2="12" />
			<line x1="21" y1="12" x2="23" y2="12" />
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
		</svg>
	);
}

function MoonIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	);
}

function ExpandIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="15 3 21 3 21 9" />
			<polyline points="9 21 3 21 3 15" />
			<line x1="21" y1="3" x2="14" y2="10" />
			<line x1="3" y1="21" x2="10" y2="14" />
		</svg>
	);
}

function CompressIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="4 14 10 14 10 20" />
			<polyline points="20 10 14 10 14 4" />
			<line x1="10" y1="14" x2="3" y2="21" />
			<line x1="21" y1="3" x2="14" y2="10" />
		</svg>
	);
}

const PRICE_AREA_LABELS: Record<"DK1" | "DK2", string> = {
	DK1: "DK Vest",
	DK2: "DK Øst",
};

function ElectricityPricesPanel() {
	const [priceArea, setPriceArea] = useState<"DK1" | "DK2">("DK1");
	const [includeTariff, setIncludeTariff] = useState(true);

	// Automatically pick the first DSO for the selected price area
	const areaGln =
		GRID_COMPANIES.find((c) => c.area === priceArea)?.gln ??
		GRID_COMPANIES[0].gln;

	const {
		start,
		end,
		displayDay,
		tomorrowAvailable,
		currentDkHour: tomorrowDkHour,
		today,
	} = useDanishDateWindow();

	const tomorrowParams: DayAheadPricesQueryParams = { priceArea, start, end };
	const todayParams: DayAheadPricesQueryParams = {
		priceArea,
		start: today.start,
		end: today.end,
	};

	const {
		data: tomorrowData,
		isPending: tomorrowPending,
		isError,
		error,
	} = useElectricityPrices(tomorrowParams, { enabled: tomorrowAvailable });
	const { data: todayData, isPending: todayPending } =
		useElectricityPrices(todayParams);

	// Use tomorrow's data only once it actually has records; fall back to today
	const usingTomorrow = tomorrowAvailable && (tomorrowData?.length ?? 0) > 0;
	const data = usingTomorrow ? tomorrowData : todayData;
	const currentDkHour = usingTomorrow ? tomorrowDkHour : today.currentDkHour;
	const isPending = usingTomorrow ? tomorrowPending : todayPending;
	const activeDisplayDay = usingTomorrow ? displayDay : today.start;
	const { data: tariffData, isPending: tariffPending } = useElectricityTariff(
		includeTariff ? areaGln : null,
	);

	const headingLabel = usingTomorrow
		? `I morgen — ${activeDisplayDay}`
		: `I dag — ${activeDisplayDay}`;
	const subLabel = usingTomorrow
		? "Kommende day-ahead priser (offentliggjort efter kl. 13:00)"
		: tomorrowAvailable
			? "Morgendagens priser hentes… viser dagens priser i mellemtiden"
			: "Dagens priser — morgendagens vises efter kl. 13:00";

	// Selected bar — defaults to the current-hour bar once data is available
	const [selectedEntry, setSelectedEntry] = useState<SelectedPriceEntry | null>(
		null,
	);
	const initialised = useRef(false);
	useEffect(() => {
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
	}, [data, tariffData, currentDkHour]);

	const priceBoxHour = selectedEntry
		? parseInt(selectedEntry.timestamp.slice(11, 13), 10)
		: 0;
	const liveTariff =
		selectedEntry && tariffData != null ? (tariffData[priceBoxHour] ?? 0) : 0;
	const liveTotal = selectedEntry
		? Math.round((selectedEntry.spotDKK + liveTariff) * 100) / 100
		: 0;

	return (
		<section className="prices-panel">
			<div className="prices-header">
				<h1 className="prices-title">⚡ Day-ahead priser · {headingLabel}</h1>
				<p className="prices-subtitle">{subLabel}</p>
			</div>

			<div className="controls">
				<fieldset className="control-group">
					<legend>Priszone</legend>
					<div className="radio-group">
						{(["DK1", "DK2"] as const).map((area) => (
							<label key={area} className="radio-label">
								<input
									type="radio"
									name="priceArea"
									value={area}
									checked={priceArea === area}
									onChange={() => setPriceArea(area)}
								/>{" "}
								{PRICE_AREA_LABELS[area]}
							</label>
						))}
					</div>
				</fieldset>

				<fieldset className="control-group">
					<legend>Tariffer</legend>
					<label className="switch-label">
						<input
							type="checkbox"
							role="switch"
							aria-checked={includeTariff}
							checked={includeTariff}
							onChange={(e) => setIncludeTariff(e.target.checked)}
							className="switch-input"
						/>
						Inkluder tariffer
					</label>
				</fieldset>

				{selectedEntry && (
					<fieldset className="control-group price-box">
						<legend>{selectedEntry.time}</legend>
						<div className="price-box-row">
							<span className="price-box-label">Spot</span>
							<span className="price-box-value">
								{selectedEntry.spotDKK.toFixed(2)} DKK/kWh
							</span>
						</div>
						{includeTariff && (
							<div className="price-box-row price-box-total">
								<span className="price-box-label">Total</span>
								<span className="price-box-value">
									{liveTotal.toFixed(2)} DKK/kWh
								</span>
							</div>
						)}
					</fieldset>
				)}
			</div>

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
				<ElectricityPriceChart
					data={data}
					tariff={includeTariff ? tariffData : undefined}
					currentDkHour={currentDkHour}
					selectedTimestamp={selectedEntry?.timestamp}
					onBarClick={setSelectedEntry}
				/>
			)}
		</section>
	);
}

export default function App() {
	const [darkMode, setDarkMode] = useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode);
		document.documentElement.classList.toggle("light", !darkMode);
		document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
	}, [darkMode]);

	useEffect(() => {
		const handler = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", handler);
		return () => document.removeEventListener("fullscreenchange", handler);
	}, []);

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	return (
		<div className="app-shell">
			<div className="app-toolbar">
				<button
					type="button"
					className="toolbar-btn"
					onClick={() => setDarkMode((d) => !d)}
					aria-label={
						darkMode ? "Skift til lystilstand" : "Skift til mørktilstand"
					}
				>
					{darkMode ? <SunIcon /> : <MoonIcon />}
				</button>
				<button
					type="button"
					className="toolbar-btn"
					onClick={toggleFullscreen}
					aria-label={isFullscreen ? "Afslut fuld skærm" : "Fuld skærm"}
				>
					{isFullscreen ? <CompressIcon /> : <ExpandIcon />}
				</button>
			</div>
			<ElectricityPricesPanel />
		</div>
	);
}
