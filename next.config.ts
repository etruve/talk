import type { NextConfig } from "next";

const nextConfig = {
    experimental: {
    optimizeCss: false  // Disables aggressive CSS chunking
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Add your Supabase storage too
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
}

module.exports = nextConfig
