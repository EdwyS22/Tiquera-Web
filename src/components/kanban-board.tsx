"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    headerBg: "bg-amber-500/10 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
  },
  {
    status: "in_progress",
    label: "En Proceso",
    icon: "⚡",
    accentColor: "border-t-sky-500",
    headerBg: "bg-sky-500/10 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-900/60",
    badgeBg: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
  },
  {
    status: "in_review",
    label: "En Revisión",
    icon: "🔍",
    accentColor: "border-t-violet-500",
    headerBg: "bg-violet-500/10 text-violet-900 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-900/60",
    badgeBg: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200",
  },
  {
    status: "completed",
    label: "Cumplido",
    icon: "✅",
    accentColor: "border-t-emerald-500",
    headerBg: "bg-emerald-500/10 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
  },
  {
    status: "expired",
    label: "Expirado / SLA",
    icon: "⚠️",
    accentColor: "border-t-slate-500",
    headerBg: "bg-slate-500/10 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-700/60",
    badgeBg: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
];

export function KanbanBoard({
  initialTickets,
}: {
  initialTickets: KanbanTicket[];
}) {
  const router = useRouter();
  const [tickets, setTickets] = useState<KanbanTicket[]>(initialTickets);
  const [mobileColumn, setMobileColumn] = useState<TicketStatus | "all">("all");
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
    <div className="flex flex-col gap-3 w-full">
      {/* Selector de columnas para dispositivos móviles: permite alternar columna o ver todas sin que se desborde */}
      <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
        <button
          type="button"
          onClick={() => setMobileColumn("all")}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            mobileColumn === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Todas ({tickets.length})
        </button>
        {STATUS_COLUMNS.map((col) => {
          const count = tickets.filter((t) => t.status === col.status).length;
          const isSelected = mobileColumn === col.status;
          return (
            <button
              key={col.status}
              type="button"
              onClick={() => setMobileColumn(col.status)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                isSelected
                  ? `${col.badgeBg} border-slate-300 ring-2 ring-blue-500/30 font-bold`
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{col.icon}</span>
              <span>{col.label}</span>
              <span className="opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Contenedor de columnas: vista deslizable en móvil o cuadrícula completa en pantallas grandes */}
      <div
        className={`flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 items-start w-full snap-x xl:grid xl:grid-cols-5 xl:overflow-x-visible ${
          mobileColumn !== "all" ? "overflow-x-visible" : ""
        }`}
      >
        {STATUS_COLUMNS.map((col) => {
          const columnTickets = tickets.filter((t) => t.status === col.status);
          const isHiddenOnMobile = mobileColumn !== "all" && mobileColumn !== col.status;

          return (
            <div
              key={col.status}
              className={`flex flex-col rounded-2xl border border-slate-200/80 bg-slate-100/75 dark:border-slate-800 dark:bg-slate-900/60 p-2.5 sm:p-3 shadow-xs transition-all ${
                isHiddenOnMobile ? "hidden xl:flex" : ""
              } ${
                mobileColumn === "all"
                  ? "w-[84vw] max-w-[285px] sm:w-[310px] xl:w-auto xl:min-w-0 shrink-0 xl:shrink snap-start"
                  : "w-full xl:w-auto xl:min-w-0 shrink-0 xl:shrink"
              }`}
            >
              {/* Cabecera de la Columna (Estilo MeisterTask / Trello) */}
              <div
                className={`flex items-center justify-between rounded-xl border border-t-4 px-3 py-2 sm:py-2.5 shadow-xs ${col.accentColor} ${col.headerBg}`}
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
              <div className="kanban-column-scroll mt-2.5 sm:mt-3 flex flex-col gap-2 sm:gap-2.5 min-h-[160px] sm:min-h-[380px] max-h-[calc(100vh-270px)] sm:max-h-[620px] 2xl:max-h-[720px] overflow-y-auto pr-1 sm:pr-1.5 focus:outline-none">
                {columnTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 dark:border-slate-800 py-8 sm:py-12 text-center">
                    <span className="text-2xl opacity-40">{col.icon}</span>
                    <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                      Sin tickets en {col.label}
                    </p>
                  </div>
                ) : (
                  columnTickets.map((ticket) => {
                    const open = isOpenStatus(ticket.status);

                    return (
                      <div
                        key={ticket.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/panel/ticket/${ticket.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            router.push(`/panel/ticket/${ticket.id}`);
                          }
                        }}
                        className="group relative flex flex-col gap-2 sm:gap-2.5 rounded-xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs transition hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.995]"
                      >
                        {/* Cabecera de tarjeta: Código y SLA */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                            #{ticket.code}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                            {open
                              ? `⏱ ${formatRemaining(new Date(ticket.dueAt))}`
                              : ticket.status === "completed"
                                ? "✓ Resuelto"
                                : "⚠️ Expirado"}
                          </span>
                        </div>

                        {/* Título del problema */}
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition break-words leading-snug">
                          {ticket.title}
                        </h4>

                        {/* Badges de clasificación: Área, Prioridad, Categoría */}
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 text-[10px]">
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

                          <span className="rounded-md border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 font-medium">
                            {CATEGORY_LABELS[ticket.category]}
                          </span>

                          {ticket.product ? (
                            <span className="rounded-md border border-blue-100 bg-blue-50/70 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 font-medium truncate max-w-[120px] sm:max-w-[130px]">
                              📦 {ticket.product}
                            </span>
                          ) : null}
                        </div>

                        {/* Acciones rápidas de movimiento tipo Kanban para tickets abiertos */}
                        {open ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800"
                          >
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mr-auto">
                              Mover:
                            </span>
                            {ticket.status !== "pending" ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(ticket.id, "pending");
                                }}
                                title="Mover a Pendiente"
                                className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60 transition cursor-pointer"
                              >
                                ⏳ Pendiente
                              </button>
                            ) : null}
                            {ticket.status !== "in_progress" ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(
                                    ticket.id,
                                    "in_progress",
                                  );
                                }}
                                title="Mover a En Proceso"
                                className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60 transition cursor-pointer"
                              >
                                ⚡ Proceso
                              </button>
                            ) : null}
                            {ticket.status !== "in_review" ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(ticket.id, "in_review");
                                }}
                                title="Mover a En Revisión"
                                className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900/60 transition cursor-pointer"
                              >
                                🔍 Revisión
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        {/* Footer de tarjeta: Asignado y Botón detalle */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[130px] sm:max-w-[150px] text-[10px] sm:text-[11px]">
                            {ticket.assignedTo ? (
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                👤 {ticket.assignedTo.name}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ Sin asignar
                              </span>
                            )}
                          </span>

                          <span className="rounded-md bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 text-[10px] sm:text-[11px] font-semibold group-hover:bg-blue-600 group-hover:text-white transition">
                            Ver &rarr;
                          </span>
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
    </div>
  );
}
