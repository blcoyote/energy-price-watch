const PRICE_AREA_LABELS: Record<"DK1" | "DK2", string> = {
	DK1: "DK Vest",
	DK2: "DK Øst",
};

export type PriceAreaControlProps = {
	value: "DK1" | "DK2";
	onChange: (area: "DK1" | "DK2") => void;
};

export function PriceAreaControl({ value, onChange }: PriceAreaControlProps) {
	return (
		<div className="control-group">
			<div className="seg-control" role="radiogroup" aria-label="Priszone">
				{(["DK1", "DK2"] as const).map((area) => (
					<label
						key={area}
						className={`seg-btn${value === area ? " seg-btn--active" : ""}`}
					>
						<input
							type="radio"
							name="priceArea"
							value={area}
							checked={value === area}
							onChange={() => onChange(area)}
							className="sr-only"
						/>
						{PRICE_AREA_LABELS[area]}
					</label>
				))}
			</div>
		</div>
	);
}
