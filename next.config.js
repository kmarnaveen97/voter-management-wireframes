/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: Enable strict checking once all type errors are resolved
    ignoreBuildErrors: true,
  },

  images: {
    // Enable image optimization for production
    unoptimized: process.env.NODE_ENV === "development",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Enable experimental features for performance
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "@tanstack/react-query",
      "@tanstack/react-virtual",
    ],
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirect legacy routes
  async redirects() {
    return [
      {
        source: "/",
        destination: "/voters-management",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
