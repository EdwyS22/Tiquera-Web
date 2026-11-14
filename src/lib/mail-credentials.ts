import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { prisma } from "@/lib/db";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET no esta definido.");
  }

  return scryptSync(secret, "tiquera-mail-cred", 32);
}

export function encryptCredential(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptCredential(value: string): string | null {
  try {
    const [ivPart, tagPart, dataPart] = value.split(".");

    if (!ivPart || !tagPart || !dataPart) {
      return null;
    }

    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivPart, "base64"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export type SenderAuth = { user: string; pass: string };

export async function senderFor(
  staffId: string | null,
): Promise<SenderAuth | null> {
  if (!staffId) {
    return null;
  }

  const user = await prisma.staffUser.findUnique({
    where: { id: staffId },
    select: { email: true, mailAppPassword: true },
  });

  if (!user?.mailAppPassword) {
    return null;
  }

  const pass = decryptCredential(user.mailAppPassword);

  return pass ? { user: user.email, pass } : null;
}
