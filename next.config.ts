import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Évite d'échouer le build Docker sur des erreurs ESLint (les warnings restent affichés)
    ignoreDuringBuilds: true,
  },
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
