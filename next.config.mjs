import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: "standalone",
  experimental: {
    // Disable optimizePackageImports to avoid vendor-chunks resolution issues in dev
    optimizePackageImports: [],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias for @/lib imports
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };

    // Ensure proper module resolution
    config.resolve.extensions = [".js", ".jsx", ".ts", ".tsx", ".json"];

    // Add fallback for modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };

    return config;
  },
};

export default nextConfig;
