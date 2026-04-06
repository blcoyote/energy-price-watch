import path from "node:path";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
	base: "/energy-price-watch/",
	plugins: [
		react(),
		babel({ presets: [reactCompilerPreset()] }),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Energy Price Watch",
				short_name: "Energy",
				description: "Monitor Danish electricity and gas prices",
				start_url: "/energy-price-watch/",
				scope: "/energy-price-watch/",
				display: "standalone",
				background_color: "#09090b",
				theme_color: "#863bff",
				icons: [
					{
						src: "favicon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any",
					},
				],
			},
			workbox: {
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.energidataservice\.dk\//,
						handler: "NetworkFirst",
						options: {
							cacheName: "energidataservice-api",
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60,
							},
						},
					},
				],
			},
		}),
	],
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
