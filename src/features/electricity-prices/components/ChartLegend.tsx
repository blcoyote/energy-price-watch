import type { ReactElement } from "react";

export function ChartLegend(): ReactElement {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				gap: "1.25rem",
				fontSize: "0.82rem",
				marginTop: "0.25rem",
			}}
		>
			<LegendItem fill="hsl(221, 83%, 62%)" label="Spotpris" />
			<LegendItem
				fill="hsl(221, 83%, 44%)"
				label="Tariffer og afgifter"
			/>
			<LegendItem fill="hsl(142, 71%, 62%)" label="Laveste" />
			<LegendItem fill="hsl(0, 72%, 62%)" label="Højeste" />
		</div>
	);
}

function LegendItem({
	fill,
	label,
}: {
	fill: string;
	label: string;
}): ReactElement {
	return (
		<span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
			<svg aria-hidden="true" width="12" height="12">
				<rect width="12" height="12" rx="2" fill={fill} />
			</svg>
			{label}
		</span>
	);
}
