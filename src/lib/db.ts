import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma_v3: PrismaClient | undefined;
  pgPool_v3: Pool | undefined;
};

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/tiquera_web?schema=public";

const pool =
  globalForPrisma.pgPool_v3 ??
  new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 15 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool_v3 = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma_v3 ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_v3 = prisma;
}
