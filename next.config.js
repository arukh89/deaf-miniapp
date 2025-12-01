/** @type {import('next').NextConfig} */
const isWin = process.platform === 'win32'
const nextConfig = {
  // Avoid symlink errors on Windows local builds
  output: isWin ? undefined : 'standalone',
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