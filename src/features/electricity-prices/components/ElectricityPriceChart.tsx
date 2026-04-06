import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { ElectricityPriceChartPoint } from "../utils";
import { toKwh } from "../utils";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import {
	makeSpotBarBackground,
	makeSpotBarShape,
	makeTariffBarShape,
} from "./barShapes";
import { COLOR_NOW } from "./chartColors";

export type SelectedPriceEntry = {
	time: string;
	timestamp: string;
	spotDKK: number;
	tariffDKK: number;
	totalDKK: number;
};

type Props = {
	data: ElectricityPriceChartPoint[];
	/** 24-element array indexed by DK hour-of-day (0=00:00…23=23:00), DKK/kWh. */
	tariff?: number[];
	/** Current Danish hour (0-23) to highlight. Omit when showing a future day. */
	currentDkHour?: number;
	/** Timestamp of the bar the user has selected. */
	selectedTimestamp?: string;
	onBarClick?: (entry: SelectedPriceEntry) => void;
};

export function ElectricityPriceChart({
	data,
	tariff,
	currentDkHour,
	selectedTimestamp,
	onBarClick,
}: Props) {
	const chartData: SelectedPriceEntry[] = data.map((d) => {
		const spot = toKwh(d.priceDKK);
		const hourIndex = parseInt(d.timestamp.slice(11, 13), 10);
		const tariffVal = tariff != null ? (tariff[hourIndex] ?? 0) : 0;
		return {
			time: d.time,
			timestamp: d.timestamp,
			spotDKK: spot,
			tariffDKK: tariffVal,
			totalDKK: Math.round((spot + tariffVal) * 100) / 100,
		};
	});

	const totals = chartData.map((d) => d.totalDKK);
	const minVal = Math.min(...totals);
	const maxVal = Math.max(...totals);
	const hasNegative = minVal < 0;

	const nowEntry =
		currentDkHour != null
			? chartData.find(
					(d) => parseInt(d.timestamp.slice(11, 13), 10) === currentDkHour,
				)
			: undefined;

	const barCtx = { minVal, maxVal, nowEntry, selectedTimestamp };

	return (
		<ResponsiveContainer width="100%" height={320}>
			<BarChart
				data={chartData}
				margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
				style={{ cursor: onBarClick ? "pointer" : undefined }}
			>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis
					dataKey="time"
					tick={{ fontSize: 12 }}
					interval="preserveStartEnd"
				/>
				<YAxis
					tick={{ fontSize: 12 }}
					tickFormatter={(v: number) => v.toFixed(2)}
					width={52}
					label={{
						value: "DKK/kWh",
						angle: -90,
						position: "insideLeft",
						offset: 12,
						style: { fontSize: 11, textAnchor: "middle" },
					}}
				/>
				<Tooltip content={ChartTooltip} />
				{tariff != null && <Legend content={ChartLegend} />}
				<Bar
					dataKey="spotDKK"
					name="spotDKK"
					stackId="price"
					isAnimationActive={false}
					onClick={(barData: unknown) =>
						onBarClick?.(barData as SelectedPriceEntry)
					}
					background={
						onBarClick
							? makeSpotBarBackground(chartData, onBarClick)
							: undefined
					}
					shape={makeSpotBarShape(barCtx)}
				/>
				{tariff != null && (
					<Bar
						dataKey="tariffDKK"
						name="tariffDKK"
						stackId="price"
						isAnimationActive={false}
						onClick={(barData: unknown) =>
							onBarClick?.(barData as SelectedPriceEntry)
						}
						shape={makeTariffBarShape(barCtx)}
					/>
				)}
				{hasNegative && (
					<ReferenceLine
						y={0}
						stroke="#94a3b8"
						strokeWidth={1}
						strokeDasharray="4 2"
					/>
				)}
				{currentDkHour != null && nowEntry != null && (
					<ReferenceLine
						x={nowEntry.time}
						stroke={COLOR_NOW}
						strokeWidth={3}
						label={{
							value: "▶ Nu",
							fill: COLOR_NOW,
							fontSize: 12,
							fontWeight: 700,
							position: "insideTopRight",
							offset: 8,
						}}
					/>
				)}
			</BarChart>
		</ResponsiveContainer>
	);
}
