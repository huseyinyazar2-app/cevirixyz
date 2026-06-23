import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['sqlite3', 'sqlite'],
};

export default nextConfig;
