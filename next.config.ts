import type { NextConfig } from "next";

const nextConfig = {
    experimental: {
    optimizeCss: false
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },

      {
        protocol: 'https',
        hostname: 'https://lzcaafgvwqgiuubnaotu.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
}

module.exports = nextConfig
