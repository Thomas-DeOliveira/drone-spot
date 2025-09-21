import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // ou 25mb selon besoin
    },
  },
  images: {
    // autoriser les images locales sous /uploads
    remotePatterns: [],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
