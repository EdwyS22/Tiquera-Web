import type { Metadata } from "next";

import { NotificationsView } from "@/components/notifications-view";
import { requireStaff } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Notificaciones | Vionest Services",
};

export default async function NotificationsPage() {
  const staff = await requireStaff();
  const isSuperadmin = staff.role === "superadmin";

  const notifications = await prisma.notification.findMany({
    where: isSuperadmin
      ? {}
      : {
          OR: [{ recipientId: staff.id }, { recipientId: null }],
        },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      readAt: true,
      createdAt: true,
      ticket: { select: { id: true, code: true } },
    },
  });

  return <NotificationsView initialNotifications={notifications} />;
}
