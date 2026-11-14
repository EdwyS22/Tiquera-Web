import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  devIndicators: false,
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "@react-pdf/renderer",
    "bullmq",
    "ioredis",
    "resend",
    "nodemailer",
    "cloudinary",
  ],
};

export default nextConfig;
