/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization in development
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Enable production source maps
  productionBrowserSourceMaps: true,
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configure powered by header
  poweredByHeader: false,
  // Configure compression
  compress: true,
  // Configure headers for security
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        }
      ]
    }
  ],
  // Handle larger file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb' // Slightly larger than our 5MB limit to account for encoding overhead
    }
  }
}

export default nextConfig
