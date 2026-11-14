import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { TicketArea } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, decryptSession, type StaffRole } from "@/lib/session-token";

export type CurrentStaff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  area: TicketArea;
};

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE)?.value);
});

export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.staffUser.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, area: true, active: true },
  });

  if (!user || !user.active) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email, role: user.role, area: user.area };
});

export async function requireStaff(): Promise<CurrentStaff> {
  const user = await getCurrentStaff();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin(): Promise<CurrentStaff> {
  const user = await requireStaff();

  if (user.role !== "admin" && user.role !== "superadmin") {
    redirect("/panel");
  }

  return user;
}

export async function requireSuperadmin(): Promise<CurrentStaff> {
  const user = await requireStaff();

  if (user.role !== "superadmin") {
    redirect("/panel");
  }

  return user;
}
