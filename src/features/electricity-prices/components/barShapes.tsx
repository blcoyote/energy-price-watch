import type { ReactElement } from "react";
import type { SelectedPriceEntry } from "./ElectricityPriceChart";
import { COLOR_NOW, COLOR_NOW_TARIFF, barFill } from "./chartColors";

type RectProps = {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	timestamp?: string;
	totalDKK?: number;
};

type BgProps = RectProps & { index?: number };

type BarShapeContext = {
	minVal: number;
	maxVal: number;
	nowEntry: SelectedPriceEntry | undefined;
	selectedTimestamp: string | undefined;
};

/** Normalises negative-height rects that Recharts can produce for negative values. */
function normaliseRect(props: RectProps): {
	x: number;
	y: number;
	width: number;
	height: number;
	timestamp: string;
	totalDKK: number;
} {
	let { y = 0, height = 0 } = props;
	if (height < 0) {
		y += height;
		height = -height;
	}
	return {
		x: props.x ?? 0,
		y,
		width: props.width ?? 0,
		height,
		timestamp: props.timestamp ?? "",
		totalDKK: props.totalDKK ?? 0,
	};
}

export function makeSpotBarShape(
	ctx: BarShapeContext,
): (props: RectProps) => ReactElement {
	return (props) => {
		const { x, y, width, height, timestamp, totalDKK } = normaliseRect(props);
		const isNow = ctx.nowEntry != null && timestamp === ctx.nowEntry.timestamp;
		const isSelected =
			ctx.selectedTimestamp != null && timestamp === ctx.selectedTimestamp;
		const fill = isNow
			? COLOR_NOW
			: barFill(totalDKK, ctx.minVal, ctx.maxVal, 62);
		return (
			<rect
				x={x}
				y={y}
				width={width}
				height={height}
				fill={fill}
				opacity={isNow ? 1 : 0.85}
				stroke={isSelected ? "#fff" : "none"}
				strokeWidth={isSelected ? 2 : 0}
			/>
		);
	};
}

export function makeSpotBarBackground(
	chartData: SelectedPriceEntry[],
	onBarClick: (entry: SelectedPriceEntry) => void,
): (props: BgProps) => ReactElement {
	return (props) => {
		const { x = 0, y = 0, width = 0, height = 0, index = 0 } = props;
		const entry = chartData[index];
		return (
			// biome-ignore lint/a11y/useSemanticElements: SVG context — <button> is not valid inside <svg>
			<rect
				role="button"
				aria-label={entry ? `Vælg pris for ${entry.time}` : undefined}
				x={x}
				y={y}
				width={width}
				height={height}
				fill="rgba(0,0,0,0)"
				style={{ cursor: "pointer", pointerEvents: "all" }}
				onClick={() => {
					if (entry) onBarClick(entry);
				}}
			/>
		);
	};
}

export function makeTariffBarShape(
	ctx: BarShapeContext,
): (props: RectProps) => ReactElement {
	return (props) => {
		const { x, y, width, height, timestamp, totalDKK } = normaliseRect(props);
		const isNow = ctx.nowEntry != null && timestamp === ctx.nowEntry.timestamp;
		const fill = isNow
			? COLOR_NOW_TARIFF
			: barFill(totalDKK, ctx.minVal, ctx.maxVal, 44);
		return <rect x={x} y={y} width={width} height={height} fill={fill} />;
	};
}
