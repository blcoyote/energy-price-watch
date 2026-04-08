// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SelectedPriceEntry } from "../types";
import { ElectricityPricesPanel } from "./ElectricityPricesPanel";

// ── Stubs ─────────────────────────────────────────────────────────────────────

vi.mock("../useDanishDateWindow", () => ({
	useDanishDateWindow: () => ({
		start: "2026-04-07",
		end: "2026-04-08",
		displayDay: "2026-04-06",
		tomorrowAvailable: false,
		tomorrowNavVisible: false,
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
						spotMwhDKK: 500,
						spotDKK: 0.63,
						tariffDKK: 0,
						totalDKK: 0.63,
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

// FAKE_DATA has priceDKK: 500 -> 0.50 ex VAT -> 0.63 incl. VAT, hour 10 is auto-selected.
// The price box in PriceControls renders these two unique strings:
const PRICE_BOX_TIME = "10:00";
const PRICE_BOX_SPOT = "0.63 kr/kWh";
const PRICE_BOX_TOTAL = "0.63 kr/kWh";

describe("ElectricityPricesPanel — outside-click dismisses chart tooltip", () => {
	it("auto-selects the current hour on mount", () => {
		renderPanel();
		expect(screen.getByText("kl. 10:00")).toBeInTheDocument();
	});

	it("keeps the price box when mousedown fires outside the chart wrapper", () => {
		renderPanel();
		expect(screen.getByText("kl. 10:00")).toBeInTheDocument();

		fireEvent.mouseDown(screen.getByRole("heading"));

		// Price box should still be visible — only the internal Recharts tooltip is dismissed
		expect(screen.getByText("kl. 10:00")).toBeInTheDocument();
	});

	it("keeps the price box when touchstart fires outside the chart wrapper", () => {
		renderPanel();
		expect(screen.getByText("kl. 10:00")).toBeInTheDocument();

		fireEvent.touchStart(screen.getByRole("heading"));

		expect(screen.getByText("kl. 10:00")).toBeInTheDocument();
	});

	it("keeps the selection when mousedown fires inside the chart wrapper", () => {
		renderPanel();
		fireEvent.click(screen.getByText("Select 14:00"));
		expect(screen.getByText("kl. 14:00")).toBeInTheDocument();

		fireEvent.mouseDown(screen.getByTestId("chart-stub"));
		expect(screen.getByText("kl. 14:00")).toBeInTheDocument();
	});
});

describe("PriceControls price box — persists after outside interaction", () => {
	it("renders the time and spot price in the price box on mount", () => {
		const { container } = renderPanel();

		const timeEl = container.querySelector(".price-box-time");
		const spotEl = container.querySelector(".price-box-spot");
		const totalEl = container.querySelector(".price-box-total-val");

		expect(timeEl).toBeInTheDocument();
		expect(timeEl).toHaveTextContent(PRICE_BOX_TIME);
		expect(spotEl).toBeInTheDocument();
		expect(spotEl).toHaveTextContent(PRICE_BOX_SPOT);
		expect(totalEl).toBeInTheDocument();
		expect(totalEl).toHaveTextContent(PRICE_BOX_TOTAL);
	});

	it("price box time and spot remain after mousedown outside the chart", () => {
		const { container } = renderPanel();

		fireEvent.mouseDown(screen.getByRole("heading"));

		expect(container.querySelector(".price-box-time")).toHaveTextContent(
			PRICE_BOX_TIME,
		);
		expect(container.querySelector(".price-box-spot")).toHaveTextContent(
			PRICE_BOX_SPOT,
		);
	});

	it("price box time and spot remain after touchstart outside the chart", () => {
		const { container } = renderPanel();

		fireEvent.touchStart(screen.getByRole("heading"));

		expect(container.querySelector(".price-box-time")).toHaveTextContent(
			PRICE_BOX_TIME,
		);
		expect(container.querySelector(".price-box-spot")).toHaveTextContent(
			PRICE_BOX_SPOT,
		);
	});

	it("price box updates when a different bar is clicked", () => {
		const { container } = renderPanel();

		fireEvent.click(screen.getByText("Select 14:00"));

		expect(container.querySelector(".price-box-time")).toHaveTextContent(
			"14:00",
		);
		expect(container.querySelector(".price-box-spot")).toHaveTextContent(
			PRICE_BOX_SPOT,
		);
	});
});
