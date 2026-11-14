"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { staffLoginSchema, type FormState } from "@/lib/validation";

const DUMMY_HASH = "$2b$12$LnZEs98Vt44RMZPMfIfBOutArY.TobqvDj8MX0yLsgLBORVG604BK";

export async function login(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = staffLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const user = await prisma.staffUser.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true, active: true },
  });

  const isValid = user
    ? await compare(password, user.passwordHash)
    : await compare(password, DUMMY_HASH);

  if (!user || !user.active || !isValid) {
    return { message: "Credenciales incorrectas o cuenta desactivada." };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/panel");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}