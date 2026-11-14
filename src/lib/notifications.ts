import type { TicketArea } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { sendStaffNotificationEmail } from "@/lib/mail";
import { senderFor } from "@/lib/mail-credentials";

export type ActivityInput = {
  ticketId: string;
  actorId: string | null;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
};

export async function logActivity(input: ActivityInput): Promise<void> {
  await prisma.ticketActivity.create({
    data: {
      ticketId: input.ticketId,
      actorId: input.actorId,
      action: input.action,
      field: input.field ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
    },
  });
}

async function activeStaff() {
  return prisma.staffUser.findMany({
    where: { active: true },
    select: { id: true, email: true },
  });
}

async function createInAppNotifications(params: {
  type: string;
  title: string;
  body: string;
  ticketId?: string;
  recipientIds: string[];
}): Promise<void> {
  if (params.recipientIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: params.recipientIds.map((recipientId) => ({
      type: params.type,
      title: params.title,
      body: params.body,
      ticketId: params.ticketId ?? null,
      recipientId,
    })),
  });
}

export async function notifyStaffTeam(params: {
  type: string;
  title: string;
  body: string;
  ticketId?: string;
  excludeUserId?: string | null;
}): Promise<void> {
  const staff = await activeStaff();
  const recipients = staff.filter(
    (member) => member.id !== params.excludeUserId,
  );

  await createInAppNotifications({
    type: params.type,
    title: params.title,
    body: params.body,
    ticketId: params.ticketId,
    recipientIds: recipients.map((member) => member.id),
  });

  await sendStaffNotificationEmail({
    recipients: recipients.map((member) => member.email),
    subject: params.title,
    body: params.body,
    sender: await senderFor(params.excludeUserId ?? null),
  });
}

export async function notifyAreaStaff(params: {
  area: TicketArea;
  type: string;
  title: string;
  body: string;
  ticketId?: string;
  excludeUserId?: string | null;
}): Promise<void> {
  const staff = await prisma.staffUser.findMany({
    where: {
      active: true,
      OR: [
        { area: params.area },
        { role: { in: ["admin", "superadmin"] } },
      ],
    },
    select: { id: true, email: true },
  });

  const recipients = staff.filter(
    (member) => member.id !== params.excludeUserId,
  );

  await createInAppNotifications({
    type: params.type,
    title: params.title,
    body: params.body,
    ticketId: params.ticketId,
    recipientIds: recipients.map((member) => member.id),
  });

  await sendStaffNotificationEmail({
    recipients: recipients.map((member) => member.email),
    subject: params.title,
    body: params.body,
    sender: await senderFor(params.excludeUserId ?? null),
  });
}

export async function notifyAssignedStaff(params: {
  type: string;
  title: string;
  body: string;
  ticketId: string;
  assignedToId: string | null;
  excludeUserId?: string | null;
}): Promise<void> {
  if (!params.assignedToId || params.assignedToId === params.excludeUserId) {
    return;
  }

  const assignee = await prisma.staffUser.findUnique({
    where: { id: params.assignedToId },
    select: { id: true, email: true, active: true },
  });

  if (!assignee || !assignee.active) {
    return;
  }

  await createInAppNotifications({
    type: params.type,
    title: params.title,
    body: params.body,
    ticketId: params.ticketId,
    recipientIds: [assignee.id],
  });

  await sendStaffNotificationEmail({
    recipients: [assignee.email],
    subject: params.title,
    body: params.body,
    sender: await senderFor(params.excludeUserId ?? null),
  });
}

export async function countUnreadNotifications(
  recipientId: string,
): Promise<number> {
  return prisma.notification.count({
    where: { recipientId, readAt: null },
  });
}
