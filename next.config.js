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
            value: [
              // Allow embedding in Farcaster + Base App
              "frame-ancestors 'self' https://farcaster.xyz https://*.farcaster.xyz https://warpcast.com https://*.warpcast.com https://deaf-miniapp.vercel.app https://base.org https://*.base.org https://app.base.org",
              // Allow Mediapipe WASM which needs eval for module init; include wasm-unsafe-eval for modern Chrome
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https: https://cdn.jsdelivr.net",
              // Reasonable defaults for other resources
              "connect-src 'self' https: wss:",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "font-src 'self' data: https:",
            ].join('; ')+ ';',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig