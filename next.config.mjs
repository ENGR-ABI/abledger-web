/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React 19 strict mode
  reactStrictMode: true,
  // TypeScript configuration
  typescript: {
    // Consider removing this in production for better type safety
    ignoreBuildErrors: false,
  },
  // Image optimization
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  // Experimental features (React 19 support)
  experimental: {
    // React 19 is now stable, but some features may still be experimental
  },
}

export default nextConfig
