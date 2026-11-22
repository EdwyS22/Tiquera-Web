"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/staff";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  ticket: { id: string; code: string } | null;
};

function formatRelative(dateStr: string): string {
  if (!dateStr) return "";
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return "";

  const now = Date.now();
  const diff = Math.max(0, now - time);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} d`;

  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
    }).format(new Date(time));
  } catch {
    return "";
  }
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "ticket_closed") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </span>
    );
  }

  if (type === "ticket_assigned") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 pointer-events-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
    </span>
  );
}

const STORAGE_READ_IDS = "vionest_read_notifications_ids";
const STORAGE_ALL_READ_AT = "vionest_all_read_timestamp";

function getLocallyReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_READ_IDS);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveLocallyReadId(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = getLocallyReadIds();
    ids.add(id);
    localStorage.setItem(STORAGE_READ_IDS, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

function getAllReadTimestamp(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(STORAGE_ALL_READ_AT) || 0);
  } catch {
    return 0;
  }
}

function setAllReadTimestamp(timestamp: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_ALL_READ_AT, timestamp.toString());
  } catch {
    // ignore
  }
}

export function NotificationsBell() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  const load = async () => {
    try {
      const res = await fetch("/api/notifications/recent", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number; items?: Item[] };
      const rawItems = data.items ?? [];

      const readIds = getLocallyReadIds();
      const allReadAt = getAllReadTimestamp();

      const resolvedItems = rawItems.map((item) => {
        const itemCreated = new Date(item.createdAt).getTime();
        const isLocallyRead =
          readIds.has(item.id) || (allReadAt > 0 && itemCreated <= allReadAt);
        if (isLocallyRead && !item.readAt) {
          return {
            ...item,
            readAt: new Date(allReadAt || Date.now()).toISOString(),
          };
        }
        return item;
      });

      const unreadCount = resolvedItems.filter((item) => !item.readAt).length;
      setCount(unreadCount);
      setItems(resolvedItems);
    } catch {
      // reintenta en el proximo ciclo
    }
  };

  const handleMarkOne = async (id: string) => {
    saveLocallyReadId(id);

    // Optimistic UI update: marca de inmediato en pantalla
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, readAt: new Date().toISOString() } : it,
      ),
    );
    setCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationRead(id);
    } catch {
      // Fallback a API endpoint si falla la Server Action
      try {
        await fetch("/api/notifications/recent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id }),
        });
      } catch {
        // Silencioso
      }
    }
  };

  const handleMarkAll = async () => {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    setAllReadTimestamp(now);

    setItems((prev) => {
      prev.forEach((it) => saveLocallyReadId(it.id));
      return prev.map((it) => ({ ...it, readAt: it.readAt ?? nowIso }));
    });
    setCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      // Fallback a API endpoint si falla la Server Action
      try {
        await fetch("/api/notifications/recent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAll: true }),
        });
      } catch {
        // Silencioso
      }
    }
  };

  useEffect(() => {
    const initial = setTimeout(load, 0);
    const interval = setInterval(load, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  // Cierre robusto al tocar fuera
  useEffect(() => {
    const handleOutside = (event: Event) => {
      if (detailsRef.current && detailsRef.current.hasAttribute("open")) {
        if (!detailsRef.current.contains(event.target as Node)) {
          detailsRef.current.removeAttribute("open");
        }
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (e.currentTarget.open) {
      // Cerrar otros dropdowns del navbar si están abiertos
      document.querySelectorAll("details[data-panel-dropdown]").forEach((el) => {
        if (el !== e.currentTarget) {
          el.removeAttribute("open");
        }
      });
    }
  };

  // Separar en Nuevas (no leídas) y Anteriores (leídas)
  const unreadItems = items.filter((item) => !item.readAt);
  const readItems = items.filter((item) => Boolean(item.readAt));

  const displayedItems = filter === "unread" ? unreadItems : items;

  return (
    <details
      ref={detailsRef}
      data-panel-dropdown
      onToggle={handleToggle}
      className="relative group"
    >
      {/* Botón de la Campana (<summary> nativo) */}
      <summary
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-5 w-5 pointer-events-none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {count > 0 ? (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white dark:ring-slate-900">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </summary>

      {/* Caja del menú: en móvil tarjeta centrada con márgenes; en desktop anclada a la derecha */}
      <div className="fixed inset-x-3 top-16 z-50 max-h-[82vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px]">
        {/* Cabecera Superior */}
        <div className="border-b border-slate-100 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/90 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                Notificaciones
              </span>
              {count > 0 ? (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  {count}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {count > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  Marcar todas leídas
                </button>
              ) : null}

              {/* Botón Cerrar en móvil */}
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Cerrar notificaciones"
                className="sm:hidden -mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtro ordenado: Todas vs Solo no leídas */}
          <div className="mt-2.5 flex items-center gap-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`flex-1 rounded-md py-1 font-semibold transition ${
                filter === "all"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Todas ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`flex-1 rounded-md py-1 font-semibold transition ${
                filter === "unread"
                  ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              No leídas ({unreadItems.length})
            </button>
          </div>
        </div>

        {/* Lista con Agrupación Ordenada */}
        {displayedItems.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {filter === "unread"
                ? "No tienes notificaciones pendientes"
                : "No hay notificaciones registradas"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Los avisos de tus tickets aparecerán organizados aquí.
            </p>
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {/* Bloque: Nuevas */}
            {filter === "all" && unreadItems.length > 0 ? (
              <div className="bg-blue-50/40 dark:bg-blue-950/40 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <span>Nuevas</span>
                <span className="rounded-full bg-blue-200/70 dark:bg-blue-900/60 px-1.5 py-0.2 text-[10px] text-blue-800 dark:text-blue-200 font-bold">
                  {unreadItems.length}
                </span>
              </div>
            ) : null}

            {/* Renderizar items no leídos */}
            {(filter === "all" ? unreadItems : displayedItems).map((item) => {
              const isUnread = !item.readAt;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 transition ${
                    isUnread
                      ? "bg-blue-50/25 hover:bg-blue-50/50 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <NotificationIcon type={item.type} />

                    <div className="min-w-0 flex-1">
                      {/* Fila 1: Ticket + Hora + Punto de no leída */}
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {item.ticket ? (
                            <Link
                              href={`/panel/ticket/${item.ticket.id}`}
                              onClick={closeMenu}
                              className="font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded text-[11px]"
                            >
                              #{item.ticket.code}
                            </Link>
                          ) : null}
                          <span className="text-slate-400 dark:text-slate-500">
                            {formatRelative(item.createdAt)}
                          </span>
                        </div>

                        {isUnread ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                            Nueva
                          </span>
                        ) : null}
                      </div>

                      {/* Fila 2: Título */}
                      <h4 className="mt-1 text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h4>

                      {/* Fila 3: Descripción */}
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>

                      {/* Fila 4: Acciones limpias */}
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100/80 dark:border-slate-800/80 text-xs">
                        {item.ticket ? (
                          <Link
                            href={`/panel/ticket/${item.ticket.id}`}
                            onClick={closeMenu}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                          >
                            Ver ticket &rarr;
                          </Link>
                        ) : <span />}

                        {isUnread ? (
                          <button
                            type="button"
                            onClick={() => handleMarkOne(item.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 font-medium transition text-[11px]"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m4.5 12.75 6 6 9-13.5"
                              />
                            </svg>
                            Marcar leída
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Separador de 'Anteriores' */}
            {filter === "all" && readItems.length > 0 && unreadItems.length > 0 ? (
              <div className="bg-slate-100/80 dark:bg-slate-950/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Anteriores
              </div>
            ) : null}

            {/* Renderizar items leídos si estamos en 'Todas' */}
            {filter === "all" &&
              readItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-start gap-3">
                    <NotificationIcon type={item.type} />

                    <div className="min-w-0 flex-1">
                      {/* Fila 1: Ticket + Hora */}
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {item.ticket ? (
                            <Link
                              href={`/panel/ticket/${item.ticket.id}`}
                              onClick={closeMenu}
                              className="font-bold text-slate-700 dark:text-slate-300 hover:underline bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]"
                            >
                              #{item.ticket.code}
                            </Link>
                          ) : null}
                          <span className="text-slate-400 dark:text-slate-500">
                            {formatRelative(item.createdAt)}
                          </span>
                        </div>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          Leída
                        </span>
                      </div>

                      {/* Fila 2: Título */}
                      <h4 className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {item.title}
                      </h4>

                      {/* Fila 3: Descripción */}
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>

                      {/* Fila 4: Ver ticket */}
                      {item.ticket ? (
                        <div className="mt-2.5 flex items-center justify-end pt-1.5 border-t border-slate-100/60 dark:border-slate-800/60 text-xs">
                          <Link
                            href={`/panel/ticket/${item.ticket.id}`}
                            onClick={closeMenu}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:underline"
                          >
                            Ver ticket &rarr;
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Pie de página con enlace */}
        <Link
          href="/panel/notificaciones"
          onClick={closeMenu}
          className="flex items-center justify-center gap-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 px-4 py-2.5 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-700 dark:hover:text-blue-300 transition"
        >
          <span>Ver centro de notificaciones completo</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </details>
  );
}
