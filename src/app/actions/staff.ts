"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { logActivity, notifyAssignedStaff, notifyStaffTeam } from "@/lib/notifications";
import {
  completeTicket,
  sendTicketMessage,
} from "@/lib/ticket-service";
import { AREA_LABELS, isOpenStatus } from "@/lib/tickets";
import {
  assignTicketSchema,
  messageSchema,
  noteSchema,
  resolveTicketSchema,
  statusSchema,
  updateTicketSchema,
  type FormState,
} from "@/lib/validation";

function revalidateTicket(ticketId: string): void {
  revalidatePath("/panel");
  revalidatePath(`/panel/ticket/${ticketId}`);
}

export async function setTicketStatus(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = statusSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, status: true, closedAt: true, assignedToId: true, code: true, title: true, area: true },
  });

  if (!ticket) {
    return { message: "Ticket no encontrado." };
  }

  if (staff.role !== "superadmin" && ticket.area !== staff.area) {
    return { message: "No tienes permiso para gestionar tickets de otra área." };
  }

  if (ticket.status === parsed.data.status) {
    return { message: "El ticket ya tiene ese estado." };
  }

  if (!isOpenStatus(ticket.status)) {
    return { message: "El ticket esta cerrado y no puede cambiar de estado." };
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: parsed.data.status,
      assignedToId: ticket.assignedToId ?? staff.id,
    },
  });

  await logActivity({
    ticketId: ticket.id,
    actorId: staff.id,
    action: "status_changed",
    field: "status",
    oldValue: ticket.status,
    newValue: parsed.data.status,
  });

  await notifyStaffTeam({
    type: "ticket_modified",
    title: `Ticket ${ticket.code}: cambio de estado`,
    body: `${staff.name} cambio el estado del ticket "${ticket.title}".`,
    ticketId: ticket.id,
    excludeUserId: staff.id,
  });

  revalidateTicket(ticket.id);
  return { ok: true, message: "Estado actualizado." };
}

export async function assignTicket(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();

  const parsed = assignTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    assignedToId: formData.get("assignedToId") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, assignedToId: true, code: true, title: true, area: true },
  });

  if (!ticket) {
    return { message: "Ticket no encontrado." };
  }

  if (staff.role !== "superadmin" && ticket.area !== staff.area) {
    return { message: "No tienes permiso para reasignar tickets de otra área." };
  }

  const newAssigneeId = parsed.data.assignedToId ?? null;

  if (ticket.assignedToId === newAssigneeId) {
    return { message: "La asignacion no cambio." };
  }

  const [previousAssignee, nextAssignee] = await Promise.all([
    ticket.assignedToId
      ? prisma.staffUser.findUnique({
          where: { id: ticket.assignedToId },
          select: { name: true },
        })
      : null,
    newAssigneeId
      ? prisma.staffUser.findUnique({
          where: { id: newAssigneeId },
          select: { name: true, role: true, area: true },
        })
      : null,
  ]);

  if (parsed.data.assignedToId && !nextAssignee) {
    return { message: "El usuario seleccionado no existe." };
  }

  // Regla de asignación estricta por área
  if (nextAssignee) {
    const isNextAdmin =
      nextAssignee.role === "admin" || nextAssignee.role === "superadmin";
    const isSameArea = nextAssignee.area === ticket.area;

    if (!isNextAdmin && !isSameArea) {
      return {
        message: `Este ticket pertenece al área de ${AREA_LABELS[ticket.area]}. Solo puede ser asignado a administradores o trabajadores de dicha área. Para asignarlo a este trabajador, primero debes mover el ticket de área.`,
      };
    }
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { assignedToId: newAssigneeId },
  });

  await logActivity({
    ticketId: ticket.id,
    actorId: staff.id,
    action: "assigned",
    field: "assignedTo",
    oldValue: previousAssignee?.name ?? "Sin asignar",
    newValue: nextAssignee?.name ?? "Sin asignar",
  });

  await notifyAssignedStaff({
    type: "ticket_assigned",
    title: `Ticket ${ticket.code} asignado a ti`,
    body: `${staff.name} te asigno el ticket "${ticket.title}".`,
    ticketId: ticket.id,
    assignedToId: newAssigneeId,
    excludeUserId: staff.id,
  });

  revalidateTicket(ticket.id);
  return { ok: true, message: "Asignacion actualizada." };
}

export async function addTicketNote(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = noteSchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, area: true },
  });

  if (!ticket) {
    return { message: "Ticket no encontrado." };
  }

  if (staff.role !== "superadmin" && ticket.area !== staff.area) {
    return { message: "No tienes permiso para agregar notas en tickets de otra área." };
  }

  await prisma.ticketNote.create({
    data: {
      ticketId: ticket.id,
      authorId: staff.id,
      body: parsed.data.body,
    },
  });

  await logActivity({
    ticketId: ticket.id,
    actorId: staff.id,
    action: "note_added",
    newValue: parsed.data.body.slice(0, 200),
  });

  revalidateTicket(ticket.id);
  return { ok: true, message: "Nota interna agregada." };
}

export async function updateTicket(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = updateTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    title: formData.get("title"),
    landingUrl: formData.get("landingUrl"),
    reporterEmail: formData.get("reporterEmail"),
    area: formData.get("area"),
    product: formData.get("product")?.toString().trim() || undefined,
    category: formData.get("category"),
    priority: formData.get("priority"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: {
      id: true,
      code: true,
      title: true,
      landingUrl: true,
      reporterEmail: true,
      description: true,
      area: true,
      product: true,
      category: true,
      priority: true,
      assignedTo: { select: { id: true, name: true, role: true, area: true } },
    },
  });

  if (!ticket) {
    return { message: "Ticket no encontrado." };
  }

  if (staff.role !== "superadmin" && ticket.area !== staff.area) {
    return { message: "No tienes permiso para editar tickets de otra área." };
  }

  if (staff.role !== "superadmin" && parsed.data.area !== staff.area) {
    return { message: "Solo los superadmins pueden cambiar el área de un ticket." };
  }

  const changes: Array<{ field: string; label: string; oldValue: string; newValue: string }> = [];

  if (ticket.title !== parsed.data.title) {
    changes.push({ field: "title", label: "Titulo", oldValue: ticket.title, newValue: parsed.data.title });
  }
  if (ticket.landingUrl !== parsed.data.landingUrl) {
    changes.push({ field: "landingUrl", label: "URL", oldValue: ticket.landingUrl, newValue: parsed.data.landingUrl });
  }
  if (ticket.reporterEmail !== parsed.data.reporterEmail) {
    changes.push({ field: "reporterEmail", label: "Correo del reportero", oldValue: ticket.reporterEmail, newValue: parsed.data.reporterEmail });
  }

  let newAssignedToId: string | null | undefined = undefined;

  if (ticket.area !== parsed.data.area) {
    changes.push({
      field: "area",
      label: "Área",
      oldValue: AREA_LABELS[ticket.area],
      newValue: AREA_LABELS[parsed.data.area],
    });

    // Si el ticket cambia de área y estaba asignado a un trabajador (no admin) de la anterior área:
    if (ticket.assignedTo) {
      const isAssigneeAdmin =
        ticket.assignedTo.role === "admin" ||
        ticket.assignedTo.role === "superadmin";
      const isSameAsNewArea = ticket.assignedTo.area === parsed.data.area;

      if (!isAssigneeAdmin && !isSameAsNewArea) {
        newAssignedToId = null;
        changes.push({
          field: "assignedTo",
          label: "Asignación",
          oldValue: ticket.assignedTo.name,
          newValue: `Desasignado (ticket movido a ${AREA_LABELS[parsed.data.area]})`,
        });
      }
    }
  }
  if ((ticket.product ?? "") !== (parsed.data.product ?? "")) {
    changes.push({
      field: "product",
      label: "Producto / Servicio",
      oldValue: ticket.product || "Sin especificar",
      newValue: parsed.data.product || "Sin especificar",
    });
  }
  if (ticket.category !== parsed.data.category) {
    changes.push({ field: "category", label: "Categoria", oldValue: ticket.category, newValue: parsed.data.category });
  }
  if (ticket.priority !== parsed.data.priority) {
    changes.push({ field: "priority", label: "Prioridad", oldValue: ticket.priority, newValue: parsed.data.priority });
  }
  if (ticket.description !== parsed.data.description) {
    changes.push({ field: "description", label: "Descripcion", oldValue: "Contenido anterior", newValue: "Descripcion actualizada" });
  }

  if (changes.length === 0) {
    return { message: "No hay cambios que guardar." };
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      title: parsed.data.title,
      landingUrl: parsed.data.landingUrl,
      reporterEmail: parsed.data.reporterEmail,
      area: parsed.data.area,
      product: parsed.data.product || null,
      category: parsed.data.category,
      priority: parsed.data.priority,
      description: parsed.data.description,
      ...(newAssignedToId !== undefined ? { assignedToId: newAssignedToId } : {}),
    },
  });

  for (const change of changes) {
    await logActivity({
      ticketId: ticket.id,
      actorId: staff.id,
      action: "updated",
      field: change.label,
      oldValue: change.oldValue.slice(0, 500),
      newValue: change.newValue.slice(0, 500),
    });
  }

  await notifyStaffTeam({
    type: "ticket_modified",
    title: `Ticket ${ticket.code} modificado`,
    body: `${staff.name} edito: ${changes.map((change) => change.label).join(", ")}.`,
    ticketId: ticket.id,
    excludeUserId: staff.id,
  });

  revalidateTicket(ticket.id);
  revalidatePath("/ticket", "layout");
  return { ok: true, message: "Ticket actualizado." };
}

export async function resolveTicket(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = resolveTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    resolutionNotes: formData.get("resolutionNotes"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, status: true, code: true, area: true },
  });

  if (!ticket) {
    return { message: "Ticket no encontrado." };
  }

  if (staff.role !== "superadmin" && ticket.area !== staff.area) {
    return { message: "No tienes permiso para cerrar tickets de otra área." };
  }

  if (!isOpenStatus(ticket.status)) {
    return { message: "El ticket ya esta cerrado." };
  }

  try {
    await completeTicket({
      ticketId: ticket.id,
      resolutionNotes: parsed.data.resolutionNotes,
      staffId: staff.id,
    });
  } catch {
    return { message: "No se pudo cerrar el ticket. Intentalo de nuevo." };
  }

  revalidateTicket(ticket.id);
  return { ok: true, message: "Ticket marcado como cumplido y cerrado." };
}

export async function messageTicketClient(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = messageSchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, area: true },
  });

  if (!ticket) {
    return { message: "Ticket no encontrado." };
  }

  if (staff.role !== "superadmin" && ticket.area !== staff.area) {
    return { message: "No tienes permiso para responder en tickets de otra área." };
  }

  let result: Awaited<ReturnType<typeof sendTicketMessage>>;

  try {
    result = await sendTicketMessage({
      ticketId: parsed.data.ticketId,
      body: parsed.data.body,
      staffId: staff.id,
    });
  } catch {
    return { message: "No se pudo enviar el mensaje. Intentalo de nuevo." };
  }

  revalidateTicket(parsed.data.ticketId);

  if (!result.emailSent) {
    return {
      ok: true,
      message:
        "Mensaje guardado en el ticket, pero el correo al cliente no se pudo enviar. Revisa la configuracion de Gmail o Resend.",
    };
  }

  return { ok: true, message: "Mensaje enviado al correo del cliente." };
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  const staff = await requireStaff();

  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: staff.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/panel/notificaciones");
}

export async function markAllNotificationsRead(): Promise<void> {
  const staff = await requireStaff();

  await prisma.notification.updateMany({
    where: { recipientId: staff.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/panel/notificaciones");
  revalidatePath("/panel");
}
