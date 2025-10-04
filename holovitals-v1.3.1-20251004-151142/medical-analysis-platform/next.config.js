/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
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
    
    // Handle tiktoken WASM files
    config.resolve.alias = {
      ...config.resolve.alias,
      'tiktoken': false,
    };
    
    return config;
  },
  // Ensure API routes are server-side only
  experimental: {
    serverComponentsExternalPackages: ['bull', 'bullmq', 'ioredis', 'tiktoken'],
  },
};

module.exports = nextConfig;