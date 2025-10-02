/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'bull': false,
        'bullmq': false,
        'ioredis': false,
      };
    }
    return config;
  },
  // Ensure API routes are server-side only
  experimental: {
    serverComponentsExternalPackages: ['bull', 'bullmq', 'ioredis'],
  },
};

module.exports = nextConfig;