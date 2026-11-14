import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tiquera_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export type StaffRole = "superadmin" | "admin" | "agent";

export type SessionPayload = {
  userId: string;
  role: StaffRole;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET no esta definido. Genera uno con: openssl rand -base64 32",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    const role = payload.role;

    if (
      !payload.sub ||
      (role !== "superadmin" && role !== "admin" && role !== "agent")
    ) {
      return null;
    }

    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}
