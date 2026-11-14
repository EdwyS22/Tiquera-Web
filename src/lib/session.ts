import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  decryptSession,
  encryptSession,
  type StaffRole,
} from "@/lib/session-token";

export async function createSession(payload: {
  userId: string;
  role: StaffRole;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const token = await encryptSession(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function readSession() {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export { SESSION_COOKIE, decryptSession, encryptSession };
