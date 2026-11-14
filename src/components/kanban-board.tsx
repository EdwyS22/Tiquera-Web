"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { setTicketStatus } from "@/app/actions/staff";
import {
  AREA_ICONS,
  AREA_LABELS,
  AREA_STYLES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  formatRemaining,
  isOpenStatus,
  type TicketArea,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";

export type KanbanTicket = {
  id: string;
  code: string;
  title: string;
  area: TicketArea;
  product?: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  dueAt: Date;
  createdAt: Date;
  assignedTo?: { id: string; name: string } | null;
  reporterEmail: string;
};

const STATUS_COLUMNS: Array<{
  status: TicketStatus;
  label: string;
  icon: string;
  accentColor: string;
  headerBg: string;
  badgeBg: string;
}> = [
  {
    status: "pending",
    label: "Pendiente",
    icon: "⏳",
    accentColor: "border-t-amber-500",
    headerBg: "bg-amber-500/10 text-amber-900 border-amber-200",
    badgeBg: "bg-amber-100 text-amber-800",
  },
  {
    status: "in_progress",
    label: "En Proceso",
    icon: "⚡",
    accentColor: "border-t-sky-500",
    headerBg: "bg-sky-500/10 text-sky-900 border-sky-200",
    badgeBg: "bg-sky-100 text-sky-800",
  },
  {
    status: "in_review",
    label: "En Revisión",
    icon: "🔍",
    accentColor: "border-t-violet-500",
    headerBg: "bg-violet-500/10 text-violet-900 border-violet-200",
    badgeBg: "bg-violet-100 text-violet-800",
  },
  {
    status: "completed",
    label: "Cumplido",
    icon: "✅",
    accentColor: "border-t-emerald-500",
    headerBg: "bg-emerald-500/10 text-emerald-900 border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
  {
    status: "expired",
    label: "Expirado / SLA",
    icon: "⚠️",
    accentColor: "border-t-slate-500",
    headerBg: "bg-slate-500/10 text-slate-800 border-slate-200",
    badgeBg: "bg-slate-200 text-slate-700",
  },
];

export function KanbanBoard({
  initialTickets,
}: {
  initialTickets: KanbanTicket[];
}) {
  const [tickets, setTickets] = useState<KanbanTicket[]>(initialTickets);
  const [isPending, startTransition] = useTransition();

  const handleQuickStatusChange = async (
    ticketId: string,
    nextStatus: "pending" | "in_progress" | "in_review",
  ) => {
    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t)),
    );

    const formData = new FormData();
    formData.append("ticketId", ticketId);
    formData.append("status", nextStatus);

    startTransition(async () => {
      const res = await setTicketStatus(undefined, formData);
      if (!res || !res.ok) {
        // Revert on failure
        setTickets(initialTickets);
      }
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start w-full snap-x xl:grid xl:grid-cols-5 xl:overflow-x-visible">
      {STATUS_COLUMNS.map((col) => {
        const columnTickets = tickets.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="flex min-w-[280px] sm:min-w-[310px] xl:min-w-0 shrink-0 xl:shrink snap-start flex-col rounded-2xl border border-slate-200/80 bg-slate-100/75 p-3 shadow-xs"
          >
            {/* Cabecera de la Columna (Estilo MeisterTask / Trello) */}
            <div
              className={`flex items-center justify-between rounded-xl border border-t-4 px-3 py-2.5 shadow-xs ${col.accentColor} ${col.headerBg}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{col.icon}</span>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  {col.label}
                </h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badgeBg}`}
              >
                {columnTickets.length}
              </span>
            </div>

            {/* Lista de Tarjetas (Tickets) con limitador y scroll interno */}
            <div className="kanban-column-scroll mt-3 flex flex-col gap-2.5 min-h-[420px] max-h-[620px] 2xl:max-h-[720px] overflow-y-auto pr-1.5 focus:outline-none">
              {columnTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 py-12 text-center">
                  <span className="text-2xl opacity-40">{col.icon}</span>
                  <p className="mt-1.5 text-xs font-medium text-slate-400">
                    Sin tickets en {col.label}
                  </p>
                </div>
              ) : (
                columnTickets.map((ticket) => {
                  const open = isOpenStatus(ticket.status);

                  return (
                    <div
                      key={ticket.id}
                      className="group relative flex flex-col gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-blue-400 hover:shadow-md"
                    >
                      {/* Cabecera de tarjeta: Código y SLA */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <Link
                          href={`/panel/ticket/${ticket.id}`}
                          className="font-mono font-bold text-blue-600 hover:underline"
                        >
                          #{ticket.code}
                        </Link>
                        <span className="text-[11px] font-medium text-slate-500">
                          {open
                            ? `⏱ ${formatRemaining(new Date(ticket.dueAt))}`
                            : ticket.status === "completed"
                              ? "✓ Resuelto"
                              : "⚠️ Expirado"}
                        </span>
                      </div>

                      {/* Título del problema */}
                      <Link
                        href={`/panel/ticket/${ticket.id}`}
                        className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-blue-600 transition"
                      >
                        {ticket.title}
                      </Link>

                      {/* Badges de clasificación: Área, Prioridad, Categoría */}
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-semibold ${AREA_STYLES[ticket.area]}`}
                        >
                          <span>{AREA_ICONS[ticket.area]}</span>
                          <span>{AREA_LABELS[ticket.area]}</span>
                        </span>

                        <span
                          className={`rounded-md px-1.5 py-0.5 font-semibold ${PRIORITY_STYLES[ticket.priority]}`}
                        >
                          {PRIORITY_LABELS[ticket.priority]}
                        </span>

                        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-medium text-slate-600">
                          {CATEGORY_LABELS[ticket.category]}
                        </span>

                        {ticket.product ? (
                          <span className="rounded-md border border-blue-100 bg-blue-50/70 px-1.5 py-0.5 font-medium text-blue-800 truncate max-w-[130px]">
                            📦 {ticket.product}
                          </span>
                        ) : null}
                      </div>

                      {/* Acciones rápidas de movimiento tipo Kanban para tickets abiertos */}
                      {open ? (
                        <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium mr-auto">
                            Mover:
                          </span>
                          {ticket.status !== "pending" ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleQuickStatusChange(ticket.id, "pending")
                              }
                              title="Mover a Pendiente"
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                            >
                              ⏳ Pendiente
                            </button>
                          ) : null}
                          {ticket.status !== "in_progress" ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleQuickStatusChange(
                                  ticket.id,
                                  "in_progress",
                                )
                              }
                              title="Mover a En Proceso"
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition"
                            >
                              ⚡ Proceso
                            </button>
                          ) : null}
                          {ticket.status !== "in_review" ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleQuickStatusChange(ticket.id, "in_review")
                              }
                              title="Mover a En Revisión"
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition"
                            >
                              🔍 Revisión
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Footer de tarjeta: Asignado y Botón detalle */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                        <span className="truncate max-w-[150px] text-[11px]">
                          {ticket.assignedTo ? (
                            <span className="font-medium text-slate-700">
                              👤 {ticket.assignedTo.name}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              ⚠️ Sin asignar
                            </span>
                          )}
                        </span>

                        <Link
                          href={`/panel/ticket/${ticket.id}`}
                          className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition"
                        >
                          Ver &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
