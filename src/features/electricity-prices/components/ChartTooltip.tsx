import type {
	NameType,
	Payload,
	ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

export function ChartTooltip({
	active,
	payload,
	label,
}: TooltipContentProps<ValueType, NameType>) {
	if (!active || !payload?.length) return null;
	return (
		<div className="chart-tooltip">
			<p className="chart-tooltip-label">Kl. {String(label)}</p>
			{(payload as Payload<ValueType, NameType>[]).map((entry) => (
				<p key={String(entry.name)} className="chart-tooltip-row">
					<span
						className="chart-tooltip-dot"
						style={{ background: entry.fill ?? entry.color }}
					/>
					<span className="chart-tooltip-name">
						{entry.name === "spotDKK"
							? "Spotpris"
							: entry.name === "tariffDKK"
								? "Tarif"
								: entry.name}
					</span>
					<span className="chart-tooltip-value">
						{Number(entry.value).toFixed(2)} DKK/kWh
					</span>
				</p>
			))}
		</div>
	);
}
