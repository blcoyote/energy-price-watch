export const COLOR_NOW = "#f97316"; // orange-500
export const COLOR_NOW_TARIFF = "#ea580c"; // orange-600

/** Returns a fill colour for a bar based on its total price relative to the day's range. */
export function barFill(
	totalDKK: number,
	minVal: number,
	maxVal: number,
	lightness: number,
): string {
	if (totalDKK === minVal) return `hsl(142, 71%, ${lightness}%)`; // green
	if (totalDKK === maxVal) return `hsl(0, 72%, ${lightness}%)`; // red
	return `hsl(221, 83%, ${lightness}%)`; // blue
}
