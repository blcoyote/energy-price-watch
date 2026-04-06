// Raw record shape returned by the DayAheadPrices dataset
// https://api.energidataservice.dk/dataset/DayAheadPrices
export type DayAheadPrice = {
	TimeUTC: string; // ISO 8601, UTC — interval start
	TimeDK: string; // ISO 8601, Danish local time — interval start
	PriceArea: "DK1" | "DK2" | "DE" | "NO2" | "SE3" | "SE4";
	DayAheadPriceEUR: number; // EUR per MWh
	DayAheadPriceDKK: number; // DKK per MWh
};

// Envelope returned by the Energi Data Service API
export type DayAheadPricesResponse = {
	total: number;
	limit: number;
	dataset: string;
	records: DayAheadPrice[];
};

export type DayAheadPricesQueryParams = {
	priceArea: "DK1" | "DK2";
	start: string; // ISO 8601 date or dynamic e.g. "now-P1D"
	end: string; // ISO 8601 date or dynamic e.g. "now"
	limit?: number;
};

// DatahubPricelist dataset — one row per ChargeTypeCode per DSO
// https://api.energidataservice.dk/dataset/DatahubPricelist
export type TariffRecord = {
	ChargeOwner: string;
	GLN_Number: string;
	ChargeType: string; // D01=Subscription D02=Fee D03=Tariff
	ChargeTypeCode: string;
	ValidFrom: string; // YYYY-MM-DD
	ValidTo: string | null;
	Price1: number | null; // DKK/kWh, hour 00:00–01:00 DK
	Price2: number | null;
	Price3: number | null;
	Price4: number | null;
	Price5: number | null;
	Price6: number | null;
	Price7: number | null;
	Price8: number | null;
	Price9: number | null;
	Price10: number | null;
	Price11: number | null;
	Price12: number | null;
	Price13: number | null;
	Price14: number | null;
	Price15: number | null;
	Price16: number | null;
	Price17: number | null;
	Price18: number | null;
	Price19: number | null;
	Price20: number | null;
	Price21: number | null;
	Price22: number | null;
	Price23: number | null;
	Price24: number | null;
	/** ISO 8601 duration. "PT1H" = hourly energy tariff; "P1D" = daily demand/capacity charge (not per-kWh). */
	ResolutionDuration: string;
};

export type GridCompany = {
	name: string;
	gln: string;
	area: "DK1" | "DK2";
};

export const GRID_COMPANIES: GridCompany[] = [
	{
		name: "Radius Elnet (DK2 – Greater Copenhagen)",
		gln: "5790000705689",
		area: "DK2",
	},
	{ name: "Cerius (DK2 – North Zealand)", gln: "5790000705184", area: "DK2" },
	{ name: "N1 (DK1 – North/Mid Jutland)", gln: "5790001089030", area: "DK1" },
	{
		name: "TREFOR El-net (DK1 – South Jutland)",
		gln: "5790000392261",
		area: "DK1",
	},
	{
		name: "Konstant Net (DK1 – Mid Jutland)",
		gln: "5790000375318",
		area: "DK1",
	},
];
