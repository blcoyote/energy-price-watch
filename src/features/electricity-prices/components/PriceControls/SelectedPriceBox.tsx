import type { ReactElement } from "react";
import type { SelectedPriceEntry } from "../../types";

export type SelectedPriceBoxProps = {
	entry: SelectedPriceEntry;
	liveTotal: number;
	showTotal: boolean;
};

export function SelectedPriceBox({
	entry,
	liveTotal,
	showTotal,
}: SelectedPriceBoxProps): ReactElement {
	return (
		<div className="control-group price-box">
			<span className="price-box-time">{entry.time}</span>
			<span className="price-box-spot">
				{entry.spotDKK.toFixed(2)} kr/kWh inkl. moms
			</span>
			{showTotal && (
				<span className="price-box-total-val">
					{liveTotal.toFixed(2)} kr/kWh inkl. moms
				</span>
			)}
		</div>
	);
}
