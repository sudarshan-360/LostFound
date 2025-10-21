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
  output: 'standalone',
  experimental: {
    // Disable optimizePackageImports to avoid vendor-chunks resolution issues in dev
    optimizePackageImports: [],
  },
};

export default nextConfig;
