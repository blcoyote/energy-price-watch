export function ChartLegend() {
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
			<LegendItem fill="hsl(221, 83%, 44%)" label="Tarif" />
		</div>
	);
}

function LegendItem({ fill, label }: { fill: string; label: string }) {
	return (
		<span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
			<svg aria-hidden="true" width="12" height="12">
				<rect width="12" height="12" rx="2" fill={fill} />
			</svg>
			{label}
		</span>
	);
}
