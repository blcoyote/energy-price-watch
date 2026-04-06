import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// On every launch, check for a new service worker immediately.
// When a new SW activates (skipWaiting is called by the autoUpdate SW),
// reload the page so the app picks up the latest assets.
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.ready.then((r) => r.update());
	let reloading = false;
	navigator.serviceWorker.addEventListener("controllerchange", () => {
		if (reloading) return;
		reloading = true;
		window.location.reload();
	});
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 15, // 15 min — matches DayAheadPrices update frequency
			retry: 2,
		},
	},
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</StrictMode>,
);
