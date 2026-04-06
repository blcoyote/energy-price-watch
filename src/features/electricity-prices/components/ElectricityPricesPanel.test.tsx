// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SelectedPriceEntry } from "./ElectricityPriceChart";
import { ElectricityPricesPanel } from "./ElectricityPricesPanel";

// ── Stubs ─────────────────────────────────────────────────────────────────────

vi.mock("../useDanishDateWindow", () => ({
	useDanishDateWindow: () => ({
		start: "2026-04-07",
		end: "2026-04-08",
		displayDay: "2026-04-06",
		tomorrowAvailable: false,
		currentDkHour: 10,
		today: { start: "2026-04-06", end: "2026-04-07", currentDkHour: 10 },
	}),
}));

const FAKE_DATA = Array.from({ length: 24 }, (_, h) => ({
	time: `${String(h).padStart(2, "0")}:00`,
	timestamp: `2026-04-06T${String(h).padStart(2, "0")}:00:00`,
	priceDKK: 500,
}));

vi.mock("../api/useElectricityPrices", () => ({
	useElectricityPrices: () => ({
		data: FAKE_DATA,
		isPending: false,
		isError: false,
		error: null,
	}),
}));

vi.mock("../api/useElectricityTariff", () => ({
	useElectricityTariff: () => ({ data: null, isPending: false }),
}));

// Replace recharts-based chart with a minimal stub that can trigger onBarClick
vi.mock("./ElectricityPriceChart", () => ({
	ElectricityPriceChart: ({
		onBarClick,
	}: {
		onBarClick?: (entry: SelectedPriceEntry) => void;
	}) => (
		<div data-testid="chart-stub">
			<button
				type="button"
				onClick={() =>
					onBarClick?.({
						time: "14:00",
						timestamp: "2026-04-06T14:00:00",
						spotDKK: 0.5,
						tariffDKK: 0,
						totalDKK: 0.5,
					})
				}
			>
				Select 14:00
			</button>
		</div>
	),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPanel() {
	const qc = new QueryClient();
	return render(
		<QueryClientProvider client={qc}>
			<ElectricityPricesPanel />
		</QueryClientProvider>,
	);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ElectricityPricesPanel — outside-click clears selection", () => {
	it("auto-selects the current hour on mount", () => {
		renderPanel();
		// useSelectedEntry auto-selects hour 10 — price box should show "10:00"
		expect(screen.getByText("10:00")).toBeInTheDocument();
	});

	it("clears the selection when mousedown fires outside the chart wrapper", () => {
		renderPanel();
		expect(screen.getByText("10:00")).toBeInTheDocument();

		fireEvent.mouseDown(screen.getByRole("heading"));

		expect(screen.queryByText("10:00")).not.toBeInTheDocument();
	});

	it("clears the selection when touchstart fires outside the chart wrapper", () => {
		renderPanel();
		expect(screen.getByText("10:00")).toBeInTheDocument();

		fireEvent.touchStart(screen.getByRole("heading"));

		expect(screen.queryByText("10:00")).not.toBeInTheDocument();
	});

	it("keeps the selection when mousedown fires inside the chart wrapper", () => {
		renderPanel();
		// First click a bar to set a specific entry
		fireEvent.click(screen.getByText("Select 14:00"));
		expect(screen.getByText("14:00")).toBeInTheDocument();

		// Mousedown inside the chart stub should NOT clear it
		fireEvent.mouseDown(screen.getByTestId("chart-stub"));
		expect(screen.getByText("14:00")).toBeInTheDocument();
	});
});
