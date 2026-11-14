import { NextResponse } from "next/server";

import { getCurrentStaff } from "@/lib/dal";
import { prisma } from "@/lib/db";

export async function GET() {
  const staff = await getCurrentStaff();

  if (!staff) {
    return NextResponse.json({ count: 0, items: [] }, { status: 401 });
  }

  const [items, count] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: staff.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { ticket: { select: { id: true, code: true } } },
    }),
    prisma.notification.count({ where: { recipientId: staff.id, readAt: null } }),
  ]);

  return NextResponse.json({ count, items });
}
