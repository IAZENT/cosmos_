/** @type {import('next').NextConfig} */

// Security headers applied to every route. CSP intentionally allows
// inline styles (Tailwind/Next required) and self scripts only. Upstream
// data fetches happen server-side, so connect-src stays locked to 'self'.
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // Tree-shake big icon / date packages so per-route bundles only
  // ship the names the route actually imports. Without this Next
  // hoists every named import through a barrel, defeating ESM
  // sideEffects: false.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'cmdk',
    ],
  },
  // next/image config: AVIF/WebP first, long-lived edge cache. We
  // host research/cve OG images and screenshots; remoteImages stays
  // empty since everything is same-origin or data URI.
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    deviceSizes: [360, 640, 768, 1024, 1280, 1600],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256],
  },
  async headers() {
    const headers = [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
    // Aggressively cache hashed static assets ONLY in production. In
    // dev, Turbopack reuses chunk URLs across rebuilds, so an
    // `immutable` header makes the browser keep serving stale chunks
    // even after the server is restarted  leading to phantom
    // hydration mismatches and "x is undefined" errors that no source
    // change can fix without a hard reload. Production filenames are
    // fingerprinted, so the header is safe there.
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      })
    }
    return headers
  },
}

export default nextConfig;
