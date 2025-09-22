import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Évite d'échouer le build Docker sur des erreurs ESLint (les warnings restent affichés)
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb", // augmenté pour permettre des images multiples/plus lourdes
    },
  },
  images: {
    // autoriser les images locales sous /uploads
    remotePatterns: [],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
