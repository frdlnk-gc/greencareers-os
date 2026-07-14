import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint blockiert den Produktions-Build nicht (Lint läuft separat).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
