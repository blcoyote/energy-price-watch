import type { SelectedPriceEntry } from "./ElectricityPriceChart";

const PRICE_AREA_LABELS: Record<"DK1" | "DK2", string> = {
	DK1: "DK Vest",
	DK2: "DK Øst",
};

type Props = {
	priceArea: "DK1" | "DK2";
	onPriceAreaChange: (area: "DK1" | "DK2") => void;
	includeTariff: boolean;
	onIncludeTariffChange: (v: boolean) => void;
	selectedEntry: SelectedPriceEntry | null;
	liveTotal: number;
};

export function PriceControls({
	priceArea,
	onPriceAreaChange,
	includeTariff,
	onIncludeTariffChange,
	selectedEntry,
	liveTotal,
}: Props) {
	return (
		<div className="controls">
			<div className="control-group">
				<div className="seg-control" role="radiogroup" aria-label="Priszone">
					{(["DK1", "DK2"] as const).map((area) => (
						<label
							key={area}
							className={`seg-btn${priceArea === area ? " seg-btn--active" : ""}`}
						>
							<input
								type="radio"
								name="priceArea"
								value={area}
								checked={priceArea === area}
								onChange={() => onPriceAreaChange(area)}
								className="sr-only"
							/>
							{PRICE_AREA_LABELS[area]}
						</label>
					))}
				</div>
			</div>

			<div className="control-group">
				<label className="switch-label">
					<input
						type="checkbox"
						role="switch"
						aria-checked={includeTariff}
						checked={includeTariff}
						onChange={(e) => onIncludeTariffChange(e.target.checked)}
						className="switch-input"
					/>
					Inkluder tariffer
				</label>
			</div>

			{selectedEntry && (
				<div className="control-group price-box">
					<span className="price-box-time">{selectedEntry.time}</span>
					<span className="price-box-spot">
						{selectedEntry.spotDKK.toFixed(2)} kr/kWh
					</span>
					{includeTariff && (
						<span className="price-box-total-val">
							{liveTotal.toFixed(2)} kr/kWh
						</span>
					)}
				</div>
			)}
		</div>
	);
}
