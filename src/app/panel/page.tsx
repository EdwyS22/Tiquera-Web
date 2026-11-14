import { KanbanBoard } from "@/components/kanban-board";
import { requireStaff } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { expireOverdueTickets } from "@/lib/ticket-service";
import {
  AREAS,
  AREA_ICONS,
  AREA_LABELS,
  AREA_STYLES,
  STATUS_LABELS,
} from "@/lib/tickets";
import type { TicketArea, TicketStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: TicketStatus[] = [
  "pending",
  "in_progress",
  "in_review",
  "completed",
  "expired",
];

const STAT_ACCENTS: Record<TicketStatus, string> = {
  pending: "border-t-amber-400",
  in_progress: "border-t-sky-400",
  in_review: "border-t-violet-400",
  completed: "border-t-emerald-400",
  expired: "border-t-slate-400",
};

type SearchParams = Promise<{
  status?: string;
  assigned?: string;
  area?: string;
  q?: string;
}>;

export default async function PanelPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const staff = await requireStaff();
  const isSuperadmin = staff.role === "superadmin";
  const { status, assigned, area, q } = await searchParams;

  try {
    await expireOverdueTickets();
  } catch (err) {
    console.warn("[panel] Aviso al expirar tickets automáticamente:", err);
  }

  const statusFilter =
    status && status !== "all" && VALID_STATUSES.includes(status as TicketStatus)
      ? (status as TicketStatus)
      : undefined;

  // Solo los superadmin pueden ver todos los tickets o filtrar por cualquier área; los demás trabajadores solo ven los de su área
  const areaFilter = isSuperadmin
    ? area && area !== "all" && AREAS.includes(area as TicketArea)
      ? (area as TicketArea)
      : undefined
    : staff.area;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(areaFilter ? { area: areaFilter } : {}),
    ...(assigned === "mine" ? { assignedToId: staff.id } : {}),
    ...(q?.trim()
      ? {
          OR: [
            { code: { contains: q.trim() } },
            { title: { contains: q.trim() } },
            { reporterEmail: { contains: q.trim() } },
          ],
        }
      : {}),
  };

  const PAGE_SIZE = 150;

  const [statusCounts, tickets, staffList] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      where: isSuperadmin ? {} : { area: staff.area },
      _count: { _all: true },
    }),
    prisma.ticket.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      include: { assignedTo: { select: { id: true, name: true } } },
      take: PAGE_SIZE,
    }),
    prisma.staffUser.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totals = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count._all]),
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Encabezado del Panel */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Tablero de Tickets por Columnas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isSuperadmin
              ? "Supervisión global de tickets organizados en columnas por estado."
              : `Bandeja de tickets exclusiva del Área de ${AREA_LABELS[staff.area]}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isSuperadmin ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${AREA_STYLES[staff.area]}`}
            >
              <span>{AREA_ICONS[staff.area]}</span>
              <span>Área: {AREA_LABELS[staff.area]}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <span>👑</span>
              <span>Superadmin</span>
            </span>
          )}
        </div>
      </header>

      {/* Métricas de Estado Rápidas */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {(
          [
            "pending",
            "in_progress",
            "in_review",
            "completed",
            "expired",
          ] as const
        ).map((item, index) => (
          <div
            key={item}
            className={`rounded-xl border border-slate-200 border-t-4 bg-white p-3 shadow-xs transition hover:shadow-sm ${
              STAT_ACCENTS[item]
            } ${index === 4 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""}`}
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:text-xs">
              {STATUS_LABELS[item]}
            </p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">
              {totals[item] ?? 0}
            </p>
          </div>
        ))}
      </section>

      {/* Filtros y Búsqueda */}
      <form
        method="get"
        action="/panel"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
      >
        <div>
          <label htmlFor="q" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Búsqueda
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Código, título o correo..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {isSuperadmin ? (
          <div>
            <label htmlFor="area" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Área
            </label>
            <select
              id="area"
              name="area"
              defaultValue={area ?? "all"}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Todas las áreas</option>
              {AREAS.map((item) => (
                <option key={item} value={item}>
                  {AREA_ICONS[item]} {AREA_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? "all"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Todos los estados</option>
            {VALID_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assigned" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Asignación
          </label>
          <select
            id="assigned"
            name="assigned"
            defaultValue={assigned ?? "all"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Todos los agentes</option>
            <option value="mine">Solo los míos</option>
          </select>
        </div>

        <div className="flex items-end gap-2 pt-1 sm:pt-0">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:bg-blue-800 sm:flex-none"
          >
            Filtrar
          </button>
          <a
            href="/panel"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-xs sm:text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 sm:flex-none"
          >
            Limpiar
          </a>
        </div>
      </form>

      {/* Vista de Columnas por Estado (Única Vista Permanente) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Columnas por Estado
          </h2>
          <span className="text-xs text-slate-500">
            {tickets.length} tickets en el tablero • Desplaza hacia abajo en cada columna para ver los demás tickets
          </span>
        </div>

        <KanbanBoard initialTickets={tickets} />
      </section>

      {/* Footer del Panel */}
      <footer className="border-t border-slate-200/60 pt-4 text-center sm:text-left">
        <p className="text-xs text-slate-400">
          {staffList.length} especialistas registrados • Tiquera Web Internal System
        </p>
      </footer>
    </div>
  );
}
