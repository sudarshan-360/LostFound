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
  experimental: {
    // Disable optimizePackageImports to avoid vendor-chunks resolution issues in dev
    optimizePackageImports: [],
  },
}

export default nextConfig
