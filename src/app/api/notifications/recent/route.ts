import { NextResponse } from "next/server";

import { getCurrentStaff } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const staff = await getCurrentStaff();

  if (!staff) {
    return NextResponse.json({ count: 0, items: [] }, { status: 401 });
  }

  const isSuperadmin = staff.role === "superadmin";
  const whereCondition = isSuperadmin
    ? {}
    : {
        OR: [{ recipientId: staff.id }, { recipientId: null }],
      };

  const [items, count] = await Promise.all([
    prisma.notification.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        readAt: true,
        createdAt: true,
        ticket: { select: { id: true, code: true } },
      },
    }),
    prisma.notification.count({
      where: { ...whereCondition, readAt: null },
    }),
  ]);

  return NextResponse.json(
    { count, items },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}

export async function POST(req: Request) {
  const staff = await getCurrentStaff();

  if (!staff) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      notificationId?: string;
      markAll?: boolean;
    };

    const isSuperadmin = staff.role === "superadmin";
    const whereCondition = isSuperadmin
      ? {}
      : {
          OR: [{ recipientId: staff.id }, { recipientId: null }],
        };

    if (body.markAll) {
      await prisma.notification.updateMany({
        where: {
          ...whereCondition,
          readAt: null,
        },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: {
          id: body.notificationId,
          ...whereCondition,
          readAt: null,
        },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Parámetros requeridos" }, { status: 400 });
  } catch (err) {
    console.error("[api/notifications/recent] Error en POST:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
