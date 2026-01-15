import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Optimize package imports to avoid loading entire barrel files
    // This reduces bundle size and improves dev boot time by 15-70%
    // See: https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },
};

export default nextConfig;
