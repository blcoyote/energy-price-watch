import { ApiError } from "@shared/api/errors";

type FrankfurterResponse = {
	rates: Record<string, number>;
};

export async function fetchEurToDkkRate(): Promise<number> {
	const url = new URL("https://api.frankfurter.dev/v1/latest");
	url.searchParams.set("from", "EUR");
	url.searchParams.set("to", "DKK");

	const res = await fetch(url.toString());
	if (!res.ok) throw new ApiError(res.status, await res.text());

	const body = (await res.json()) as FrankfurterResponse;
	const rate = body.rates["DKK"];
	if (rate === undefined)
		throw new ApiError(500, "DKK rate missing from response");
	return rate;
}
