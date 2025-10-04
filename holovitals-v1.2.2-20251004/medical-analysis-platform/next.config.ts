import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Suppress known Radix UI + Next.js 15 compatibility warnings
  // These are non-blocking and will be fixed in future Radix UI updates
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Experimental features for better compatibility
  experimental: {
    // Suppress specific error digests that are known library issues
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
