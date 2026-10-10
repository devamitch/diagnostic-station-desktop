/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

// Create the next-intl plugin with the correct path
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
	output: 'export',
	distDir: '../app', // Nextron expects this
	trailingSlash: true,
	images: {
		unoptimized: true,
	},
	reactStrictMode: true,

	// Remove assetPrefix to avoid next/font issues
	// The resource loading will be handled by Electron's serve mechanism

	// Handle SVG imports
	webpack: (config) => {
		config.module.rules.push({
			test: /\.svg$/,
			use: ['@svgr/webpack'],
		});

		// Ensure WASM files are properly handled
		config.resolve.extensions.push('.wasm');
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		};

		return config;
	},

	// Electron-specific settings
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},

	env: {
		NEXT_PUBLIC_IS_ELECTRON: 'true',
	},

	// Enable compression for better performance
	compress: true,
};

// Apply only the next-intl plugin for now
module.exports = withNextIntl(nextConfig);
