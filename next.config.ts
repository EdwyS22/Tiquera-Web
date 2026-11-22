import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  devIndicators: false,
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "@react-pdf/renderer",
    "bullmq",
    "ioredis",
    "resend",
    "nodemailer",
    "cloudinary",
  ],
};

export default nextConfig;
