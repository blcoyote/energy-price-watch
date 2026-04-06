import type { ReactElement } from "react";

const PRICE_AREA_LABELS = {
	DK1: "DK Vest",
	DK2: "DK Øst",
} as const;

export type PriceAreaControlProps = {
	value: "DK1" | "DK2";
	onChange: (area: "DK1" | "DK2") => void;
};

export function PriceAreaControl({
	value,
	onChange,
}: PriceAreaControlProps): ReactElement {
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
