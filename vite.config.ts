import path from "node:path";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
	base: "/energy-price-watch/",
	plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
	resolve: {
		alias: {
			"@features": path.resolve(__dirname, "src/features"),
			"@shared": path.resolve(__dirname, "src/shared"),
		},
	},
	test: {
		environment: "node",
		globals: true,
		alias: {
			"@features": path.resolve(__dirname, "src/features"),
			"@shared": path.resolve(__dirname, "src/shared"),
		},
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts", "src/**/*.tsx"],
			exclude: ["src/**/*.test.ts", "src/main.tsx"],
		},
	},
});
