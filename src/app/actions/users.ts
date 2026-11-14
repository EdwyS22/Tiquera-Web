"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

import { requireSuperadmin } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { sendStaffWelcomeEmail } from "@/lib/mail";
import { encryptCredential, senderFor } from "@/lib/mail-credentials";
import { AREA_LABELS, ROLE_LABELS } from "@/lib/tickets";
import {
  createStaffUserSchema,
  deleteUserSchema,
  resetPasswordSchema,
  setMailPasswordSchema,
  setStaffUserAreaSchema,
  toggleUserSchema,
  type FormState,
} from "@/lib/validation";

export async function createStaffUser(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireSuperadmin();

  const parsed = createStaffUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    area: formData.get("area"),
    mailAppPassword: formData.get("mailAppPassword") ?? undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.staffUser.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return { message: "Ya existe un usuario con ese correo." };
  }

  const user = await prisma.staffUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hash(parsed.data.password, 12),
      role: parsed.data.role,
      area: parsed.data.area,
      mailAppPassword:
        parsed.data.mailAppPassword && parsed.data.mailAppPassword.length >= 16
          ? encryptCredential(parsed.data.mailAppPassword)
          : null,
    },
  });

  let mailNote = "";

  try {
    const result = await sendStaffWelcomeEmail({
      to: user.email,
      name: user.name,
      roleLabel: ROLE_LABELS[user.role],
      sender: await senderFor(actor.id),
    });

    if (!result.delivered) {
      mailNote = " Pero el correo de bienvenida no se envio: conecta el Gmail del usuario o de un admin.";
    }
  } catch (error) {
    console.error("[users] No se pudo enviar el correo de bienvenida.", error);
    mailNote = " Pero el correo de bienvenida no se envio.";
  }

  revalidatePath("/panel/usuarios");
  return {
    ok: true,
    message: `Usuario creado. Creado por ${actor.name}.${mailNote}`,
  };
}

export async function toggleStaffUser(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireSuperadmin();
  const parsed = toggleUserSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.userId === actor.id) {
    return { message: "No puedes desactivar tu propia cuenta." };
  }

  const user = await prisma.staffUser.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, active: true, name: true },
  });

  if (!user) {
    return { message: "Usuario no encontrado." };
  }

  await prisma.staffUser.update({
    where: { id: user.id },
    data: { active: !user.active },
  });

  revalidatePath("/panel/usuarios");
  return {
    ok: true,
    message: user.active
      ? `Cuenta de ${user.name} desactivada.`
      : `Cuenta de ${user.name} activada.`,
  };
}

export async function resetStaffPassword(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSuperadmin();
  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.staffUser.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true },
  });

  if (!user) {
    return { message: "Usuario no encontrado." };
  }

  await prisma.staffUser.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.password, 12) },
  });

  revalidatePath("/panel/usuarios");
  return { ok: true, message: `Contrasena actualizada para ${user.name}.` };
}

export async function deleteStaffUser(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireSuperadmin();
  const parsed = deleteUserSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.userId === actor.id) {
    return { message: "No puedes eliminar tu propia cuenta." };
  }

  const user = await prisma.staffUser.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, role: true, active: true },
  });

  if (!user) {
    return { message: "Usuario no encontrado." };
  }

  if (user.role === "admin" || user.role === "superadmin") {
    const remainingAdmins = await prisma.staffUser.count({
      where: {
        id: { not: user.id },
        role: { in: ["admin", "superadmin"] },
        active: true,
      },
    });

    if (remainingAdmins === 0) {
      return {
        message: "No se puede eliminar: debe quedar al menos un admin activo.",
      };
    }
  }

  await prisma.staffUser.delete({ where: { id: user.id } });

  revalidatePath("/panel/usuarios");
  return { ok: true, message: `Cuenta de ${user.name} eliminada.` };
}

export async function setUserMailPassword(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSuperadmin();
  const parsed = setMailPasswordSchema.safeParse({
    userId: formData.get("userId"),
    mailAppPassword: formData.get("mailAppPassword") ?? "",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.staffUser.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return { message: "Usuario no encontrado." };
  }

  const disconnect = parsed.data.mailAppPassword === "";

  await prisma.staffUser.update({
    where: { id: user.id },
    data: { mailAppPassword: disconnect ? null : encryptCredential(parsed.data.mailAppPassword) },
  });

  revalidatePath("/panel/usuarios");
  return {
    ok: true,
    message: disconnect
      ? `${user.name} quedo desconectado de Gmail.`
      : `${user.name} conectado a ${user.email}.`,
  };
}

export async function setStaffUserArea(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSuperadmin();
  const parsed = setStaffUserAreaSchema.safeParse({
    userId: formData.get("userId"),
    area: formData.get("area"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.staffUser.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true },
  });

  if (!user) {
    return { message: "Usuario no encontrado." };
  }

  await prisma.staffUser.update({
    where: { id: user.id },
    data: { area: parsed.data.area },
  });

  revalidatePath("/panel/usuarios");
  return {
    ok: true,
    message: `Área de ${user.name} actualizada a ${AREA_LABELS[parsed.data.area]}.`,
  };
}
