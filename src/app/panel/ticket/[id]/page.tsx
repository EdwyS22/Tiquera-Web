import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { TicketManager } from "@/components/ticket-manager";
import { requireStaff } from "@/lib/dal";
import { prisma } from "@/lib/db";
import {
  ACTIVITY_LABELS,
  AREA_ICONS,
  AREA_LABELS,
  AREA_STYLES,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  isOpenStatus,
} from "@/lib/tickets";

export const metadata: Metadata = {
  title: "Detalle de ticket | Tiquera Web",
};

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "long",
  timeStyle: "short",
});

export default async function PanelTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;
  const isSuperadmin = staff.role === "superadmin";

  const [ticket, staffList] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { name: true, email: true } },
        attachments: true,
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { name: true } } },
          take: 100,
        },
      },
    }),
    prisma.staffUser.findMany({
      where: { active: true },
      select: { id: true, name: true, area: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ticket) {
    notFound();
  }

  // Restricción por área: solo superadmin puede ver tickets de otras áreas
  if (!isSuperadmin && ticket.area !== staff.area) {
    notFound();
  }

  const isOpen = isOpenStatus(ticket.status);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Botón Volver y acción de PDF */}
      <div className="flex items-center justify-between">
        <Link
          href="/panel"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
        >
          <span>&larr;</span>
          <span>Volver al panel</span>
        </Link>
        {!isOpen && ticket.closedAt ? (
          <a
            href={`/api/tickets/${ticket.code}/pdf`}
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs transition hover:bg-emerald-100"
          >
            <span>📄</span>
            <span>Descargar PDF Oficial</span>
          </a>
        ) : null}
      </div>

      {/* Cabecera Principal */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ticket
          </span>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-slate-900">
            #{ticket.code}
          </h1>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${AREA_STYLES[ticket.area]}`}
          >
            <span>{AREA_ICONS[ticket.area]}</span>
            <span>{AREA_LABELS[ticket.area]}</span>
          </span>
          {ticket.product ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
              <span>📦</span>
              <span>{ticket.product}</span>
            </span>
          ) : null}
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}
          >
            {STATUS_LABELS[ticket.status]}
          </span>
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[ticket.priority]}`}
          >
            Prioridad {PRIORITY_LABELS[ticket.priority]}
          </span>
        </div>

        <p className="mt-2 text-lg font-bold text-slate-800 sm:text-xl">
          {ticket.title}
        </p>
      </header>

      {/* Workspace de Gestión (2 Columnas: Acciones descendentes a la izquierda + Parámetros a la derecha) */}
      <TicketManager
        ticket={ticket}
        staffList={staffList}
        messages={ticket.messages}
        notes={ticket.notes}
      />

      {/* Historial de cambios para Superadministradores */}
      {isSuperadmin ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Historial de auditoría y cambios
          </h2>
          {ticket.activities.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Todavía no hay cambios registrados en este ticket.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {ticket.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">
                      {ACTIVITY_LABELS[activity.action] ?? activity.action}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {dateFormatter.format(activity.createdAt)}
                      {activity.actor
                        ? ` · ${activity.actor.name}`
                        : " · Sistema"}
                    </span>
                  </div>
                  {activity.field || activity.oldValue || activity.newValue ? (
                    <p className="mt-1 text-slate-600 text-[11px]">
                      {activity.field ? (
                        <span className="font-medium">{activity.field}: </span>
                      ) : null}
                      {activity.oldValue ? (
                        <span className="line-through decoration-slate-300">
                          {activity.oldValue}
                        </span>
                      ) : null}
                      {activity.oldValue && activity.newValue ? " → " : null}
                      {activity.newValue ?? activity.oldValue ? (
                        <span className="font-medium text-slate-800">
                          {activity.newValue}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
