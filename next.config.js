/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Headers untuk keamanan dan CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://farcaster.xyz https://*.farcaster.xyz https://warpcast.com https://*.warpcast.com https://deaf-miniapp.vercel.app;",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig