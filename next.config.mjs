/** @type {import('next').NextConfig} */
const nextConfig = {
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
