import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // En Vercel Serverless, el directorio de la aplicación es de solo lectura.
  // Copiamos la base de datos preconfigurada a /tmp para que SQLite pueda leer y escribir libremente.
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    const sourceDbPath = path.join(process.cwd(), "dev.db");

    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      }
    } catch (err) {
      console.warn("[db] Aviso al preparar base de datos en /tmp:", err);
    }

    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL ?? "file:./dev.db";
}

const adapter = new PrismaBetterSqlite3({
  url: getDatabaseUrl(),
});

const globalForPrisma = globalThis as unknown as {
  prisma_v3: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma_v3 ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma_v3 = prisma;
}
