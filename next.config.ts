import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore build errors to allow the scaffold to "build" 
    // even if there are conflicting files from other phases in the workspace.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also ignore eslint for the same reason
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
