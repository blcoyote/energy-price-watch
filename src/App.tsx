import { ElectricityPricesPanel } from "@features/electricity-prices";
import { useEffect, useState } from "react";
import "./App.css";
import { CompressIcon, ExpandIcon, MoonIcon, SunIcon } from "./ui/icons";

export default function App() {
	const [darkMode, setDarkMode] = useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode);
		document.documentElement.classList.toggle("light", !darkMode);
		document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
	}, [darkMode]);

	useEffect(() => {
		const handler = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", handler);
		return () => document.removeEventListener("fullscreenchange", handler);
	}, []);

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	return (
		<div className="app-shell">
			<div className="app-toolbar">
				<button
					type="button"
					className="toolbar-btn"
					onClick={() => setDarkMode((d) => !d)}
					aria-label={
						darkMode ? "Skift til lystilstand" : "Skift til mørktilstand"
					}
				>
					{darkMode ? <SunIcon /> : <MoonIcon />}
				</button>
				<button
					type="button"
					className="toolbar-btn"
					onClick={toggleFullscreen}
					aria-label={isFullscreen ? "Afslut fuld skærm" : "Fuld skærm"}
				>
					{isFullscreen ? <CompressIcon /> : <ExpandIcon />}
				</button>
			</div>
			<ElectricityPricesPanel />
		</div>
	);
}
