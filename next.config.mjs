/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Rewrites barrel imports to per-module paths so unused exports are dropped.
    // d3 is only used on /map and in ComplexityGauge; framer-motion is used across lesson/stage UI.
    optimizePackageImports: ['framer-motion', 'd3'],
  },
  compiler: {
    // Keep error/warn so production failures still surface in the browser console.
    removeConsole: { exclude: ['error', 'warn'] },
  },
  async redirects() {
    return [
      {
        source: '/learn/stacks-queues',
        destination: '/learn/stacks',
        permanent: true,
      },
      {
        source: '/learn/backtracking',
        destination: '/learn/recursion',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
