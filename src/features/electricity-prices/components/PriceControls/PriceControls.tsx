import type { SelectedPriceEntry } from "../ElectricityPriceChart";
import { PriceAreaControl } from "./PriceAreaControl";
import { SelectedPriceBox } from "./SelectedPriceBox";
import { TariffToggle } from "./TariffToggle";

export type PriceControlsProps = {
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
}: PriceControlsProps) {
	return (
		<div className="controls">
			<PriceAreaControl value={priceArea} onChange={onPriceAreaChange} />
			<TariffToggle checked={includeTariff} onChange={onIncludeTariffChange} />
			{selectedEntry && (
				<SelectedPriceBox
					entry={selectedEntry}
					liveTotal={liveTotal}
					showTotal={includeTariff}
				/>
			)}
		</div>
	);
}
