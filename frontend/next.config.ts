import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.65'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      // Permite imágenes servidas desde el backend local en producción
      { protocol: 'http',  hostname: '*' },
    ],
  },
};

export default nextConfig;
