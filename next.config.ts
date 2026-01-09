import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize package imports for faster compilation
  experimental: {
    optimizePackageImports: [
      "@solana/web3.js",
      "@tanstack/react-query",
      "@react-three/fiber",
      "@react-three/drei",
      "framer-motion",
      "lucide-react",
    ],
  },

  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,

  // Turbopack configuration for faster compilation
  turbopack: {
    // Resolve aliases for faster module resolution
    resolveAlias: {
      // Add any custom aliases here if needed
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Webpack optimizations (fallback if Turbopack disabled)
  webpack: (config, { dev }) => {
    if (dev) {
      // Faster rebuilds in development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
