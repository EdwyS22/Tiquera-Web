import type {
  TicketArea,
  TicketCategory,
  TicketPriority,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import {
  sendTicketClosedEmail,
  sendTicketMessageEmail,
} from "@/lib/mail";
import { senderFor } from "@/lib/mail-credentials";
import {
  logActivity,
  notifyAreaStaff,
  notifyAssignedStaff,
  notifyStaffTeam,
} from "@/lib/notifications";
import { renderTicketPdf } from "@/lib/pdf";
import { scheduleSlaExpiration } from "@/lib/queue";
import { storeFile } from "@/lib/storage";
import { classifyTicket } from "@/lib/ticket-classifier";
import {
  AREA_LABELS,
  OPEN_STATUSES,
  generateTicketCode,
  slaDeadline,
} from "@/lib/tickets";

export const MAX_ATTACHMENTS = 5;

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

const globalState = globalThis as unknown as {
  __tiqueraLastSweep: number | undefined;
};

export type CreateTicketInput = {
  title: string;
  landingUrl: string;
  reporterEmail: string;
  area?: TicketArea;
  product?: string | null;
  category?: TicketCategory;
  priority?: TicketPriority;
  description: string;
  files: File[];
  createdById?: string | null;
};

export async function findBestAssigneeForArea(
  area: TicketArea,
): Promise<string | null> {
  // Buscar empleados activos que pertenezcan a esta área
  const employees = await prisma.staffUser.findMany({
    where: {
      area,
      active: true,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          assignedTickets: {
            where: {
              status: { in: OPEN_STATUSES },
            },
          },
        },
      },
    },
  });

  if (employees.length === 0) {
    return null;
  }

  // Ordenar por menor cantidad de tickets abiertos (balanceo automático)
  employees.sort((a, b) => a._count.assignedTickets - b._count.assignedTickets);
  return employees[0].id;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateTicketCode();
    const existing = await prisma.ticket.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  return `TK-${Date.now().toString().slice(-6)}`;
}

export async function createTicket(input: CreateTicketInput) {
  const now = new Date();
  const dueAt = slaDeadline(now);
  const code = await generateUniqueCode();

  // Si no se proporcionó área, categoría o prioridad, clasificar automáticamente según el texto
  const classification =
    !input.area || !input.category || !input.priority
      ? classifyTicket(input.title, input.description)
      : null;

  const area = input.area ?? classification?.area ?? "tecnologia";
  const category = input.category ?? classification?.category ?? "funcionalidad";
  const priority = input.priority ?? classification?.priority ?? "medium";
  const product = input.product ?? classification?.product ?? null;

  // Flujo automatizado: asignación automática a un trabajador del área correspondiente
  const autoAssigneeId = await findBestAssigneeForArea(area);

  const ticket = await prisma.ticket.create({
    data: {
      code,
      title: input.title,
      landingUrl: input.landingUrl,
      reporterEmail: input.reporterEmail,
      description: input.description,
      area,
      product,
      category,
      priority,
      status: "pending",
      dueAt,
      createdById: input.createdById ?? null,
      assignedToId: autoAssigneeId,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    ticketId: ticket.id,
    actorId: input.createdById ?? null,
    action: "created",
    field: "area",
    newValue: AREA_LABELS[area],
  });

  if (product) {
    await logActivity({
      ticketId: ticket.id,
      actorId: input.createdById ?? null,
      action: "created",
      field: "product",
      newValue: product,
    });
  }

  if (ticket.assignedTo) {
    await logActivity({
      ticketId: ticket.id,
      actorId: null,
      action: "assigned",
      field: "assignedTo",
      oldValue: "Sin asignar",
      newValue: `${ticket.assignedTo.name} (Flujo automático: ${AREA_LABELS[area]})`,
    });

    await notifyAssignedStaff({
      type: "ticket_assigned",
      title: `Ticket ${ticket.code} asignado automáticamente`,
      body: `El ticket "${ticket.title}" del área ${AREA_LABELS[area]} te fue asignado automáticamente.`,
      ticketId: ticket.id,
      assignedToId: ticket.assignedTo.id,
    });
  }

  // Notificar al equipo del área (y administradores)
  await notifyAreaStaff({
    area,
    type: "ticket_created",
    title: `Nuevo ticket para ${AREA_LABELS[area]}: ${ticket.code}`,
    body: ticket.assignedTo
      ? `Dirigido a ${AREA_LABELS[area]} y asignado a ${ticket.assignedTo.name}.`
      : `Dirigido a ${AREA_LABELS[area]} (pendiente de asignación a un empleado).`,
    ticketId: ticket.id,
    excludeUserId: ticket.assignedTo?.id,
  });

  const files = input.files
    .filter((file) => file.size > 0)
    .slice(0, MAX_ATTACHMENTS);

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeFile({
      buffer,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    await prisma.attachment.create({
      data: {
        ticketId: ticket.id,
        fileUrl: stored.fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        publicId: stored.publicId ?? null,
      },
    });
  }

  await scheduleSlaExpiration(ticket.id, dueAt.getTime() - now.getTime());

  return ticket;
}

export async function finalizeClosedTicket(ticketId: string): Promise<void> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
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
      status: true,
      resolutionNotes: true,
      createdAt: true,
      dueAt: true,
      closedAt: true,
      assignedToId: true,
      createdById: true,
      assignedTo: { select: { name: true } },
    },
  });

  if (!ticket || !ticket.closedAt) {
    return;
  }

  try {
    const pdf = await renderTicketPdf({
      code: ticket.code,
      title: ticket.title,
      landingUrl: ticket.landingUrl,
      reporterEmail: ticket.reporterEmail,
      description: ticket.description,
      area: ticket.area,
      product: ticket.product,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      resolutionNotes: ticket.resolutionNotes,
      createdAt: ticket.createdAt,
      dueAt: ticket.dueAt,
      closedAt: ticket.closedAt,
      assignedToName: ticket.assignedTo?.name ?? null,
    });

    await sendTicketClosedEmail({
      to: ticket.reporterEmail,
      code: ticket.code,
      title: ticket.title,
      status: ticket.status === "completed" ? "completed" : "expired",
      resolutionNotes: ticket.resolutionNotes,
      pdf,
      sender: await senderFor(ticket.assignedToId ?? ticket.createdById),
    });
  } catch (error) {
    console.warn(`[ticket] Aviso al procesar cierre/correo del ticket ${ticket.code}:`, error);
  }
}

export async function completeTicket(params: {
  ticketId: string;
  resolutionNotes: string;
  staffId: string;
}) {
  const now = new Date();

  const existing = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    select: { id: true, assignedToId: true },
  });

  if (!existing) {
    throw new Error("Ticket no encontrado.");
  }

  const ticket = await prisma.ticket.update({
    where: { id: params.ticketId },
    data: {
      status: "completed",
      resolutionNotes: params.resolutionNotes,
      resolutionAt: now,
      closedAt: now,
      assignedToId: existing.assignedToId ?? params.staffId,
    },
  });

  await logActivity({
    ticketId: ticket.id,
    actorId: params.staffId,
    action: "closed",
    field: "resolutionNotes",
    newValue: params.resolutionNotes,
  });

  await finalizeClosedTicket(ticket.id);

  await notifyStaffTeam({
    type: "ticket_closed",
    title: `Ticket ${ticket.code} cerrado`,
    body: `El ticket "${ticket.title}" fue marcado como cumplido y cerrado.`,
    ticketId: ticket.id,
    excludeUserId: params.staffId,
  });

  return ticket;
}

export async function sendTicketMessage(params: {
  ticketId: string;
  body: string;
  staffId: string;
}) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.ticketId },
    select: {
      id: true,
      code: true,
      title: true,
      reporterEmail: true,
      assignedToId: true,
    },
  });

  if (!ticket) {
    throw new Error("Ticket no encontrado.");
  }

  const author = await prisma.staffUser.findUnique({
    where: { id: params.staffId },
    select: { name: true },
  });

  let emailResult: { delivered: boolean; error?: string } = {
    delivered: false,
  };
  let emailError: string | undefined;

  try {
    const result = await sendTicketMessageEmail({
      to: ticket.reporterEmail,
      code: ticket.code,
      ticketTitle: ticket.title,
      body: params.body,
      authorName: author?.name ?? "Equipo de soporte",
      sender: await senderFor(params.staffId),
    });
    emailResult = result;
    if (!result.delivered) {
      emailError = result.error;
    }
  } catch (error) {
    emailError = error instanceof Error ? error.message : String(error);
    console.error(`[ticket] No se pudo enviar el mensaje del ticket ${ticket.code}`, error);
  }

  const emailSent = emailResult.delivered;

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: params.staffId,
      body: params.body,
      emailSent,
    },
  });

  await logActivity({
    ticketId: ticket.id,
    actorId: params.staffId,
    action: "message_sent",
    newValue: params.body.slice(0, 200),
  });

  await notifyStaffTeam({
    type: "ticket_modified",
    title: `Ticket ${ticket.code}: mensaje enviado al cliente`,
    body: `${author?.name ?? "Un miembro del equipo"} envio un mensaje a ${ticket.reporterEmail}.`,
    ticketId: ticket.id,
    excludeUserId: params.staffId,
  });

  return { message, emailSent, emailError };
}

export async function expireOverdueTickets(): Promise<number> {
  const lastSweep = globalState.__tiqueraLastSweep ?? 0;

  if (Date.now() - lastSweep < SWEEP_INTERVAL_MS) {
    return 0;
  }

  globalState.__tiqueraLastSweep = Date.now();

  const overdue = await prisma.ticket.findMany({
    where: { status: { in: OPEN_STATUSES }, dueAt: { lt: new Date() } },
    select: { id: true, code: true, title: true },
  });

  let closed = 0;

  for (const item of overdue) {
    const result = await prisma.ticket.updateMany({
      where: { id: item.id, status: { in: OPEN_STATUSES } },
      data: { status: "expired", closedAt: new Date() },
    });

    if (result.count > 0) {
      closed += 1;

      await logActivity({
        ticketId: item.id,
        actorId: null,
        action: "closed",
        field: "status",
        oldValue: "pending/in_progress/in_review",
        newValue: "expired",
      });

      try {
        await finalizeClosedTicket(item.id);
      } catch (err) {
        console.warn(`[ticket] Error al finalizar ticket ${item.code}:`, err);
      }

      await notifyStaffTeam({
        type: "ticket_closed",
        title: `Ticket ${item.code} expirado por SLA`,
        body: `El ticket "${item.title}" supero las 24 horas de SLA y fue cerrado automaticamente.`,
        ticketId: item.id,
      });
    }
  }

  return closed;
}
