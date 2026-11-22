"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/staff";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | string | null;
  createdAt: Date | string;
  ticket?: { id: string; code: string } | null;
};

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

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

function NotificationIcon({ type }: { type: string }) {
  if (type === "ticket_closed") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50 dark:bg-emerald-950/70 dark:text-emerald-400 dark:ring-emerald-950/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-4 ring-amber-50 dark:bg-amber-950/70 dark:text-amber-400 dark:ring-amber-950/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
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
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-4 ring-blue-50 dark:bg-blue-950/70 dark:text-blue-400 dark:ring-blue-950/30">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="h-5 w-5"
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

export function NotificationsView({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);

  // Conciliar con localStorage inmediatamente en el cliente
  useEffect(() => {
    const readIds = getLocallyReadIds();
    const allReadAt = getAllReadTimestamp();

    setItems((prev) =>
      prev.map((it) => {
        const itemCreated = new Date(it.createdAt).getTime();
        const isLocallyRead =
          readIds.has(it.id) || (allReadAt > 0 && itemCreated <= allReadAt);
        if (isLocallyRead && !it.readAt) {
          return {
            ...it,
            readAt: new Date(allReadAt || Date.now()).toISOString(),
          };
        }
        return it;
      }),
    );
  }, []);

  const handleMarkOne = async (id: string) => {
    saveLocallyReadId(id);

    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, readAt: new Date().toISOString() }
          : it,
      ),
    );

    try {
      await markNotificationRead(id);
    } catch {
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

    try {
      await markAllNotificationsRead();
    } catch {
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

  const unreadCount = items.filter((it) => !it.readAt).length;

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-4xl mx-auto">
      <Link
        href="/panel"
        aria-label="Volver al panel"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <span className="text-base font-bold leading-none">&larr;</span>
      </Link>

      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Centro de Notificaciones
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                Tienes {unreadCount} notificación{unreadCount === 1 ? "" : "es"} sin leer
              </span>
            ) : (
              "Estás al día con todos tus tickets y avisos."
            )}
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
            Marcar todas como leídas
          </button>
        ) : null}
      </header>

      {/* Lista de Notificaciones */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Sin notificaciones pendientes
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Aquí aparecerán las actualizaciones y asignaciones de tus casos.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((notification) => {
            const isUnread = !notification.readAt;

            return (
              <li
                key={notification.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 sm:p-5 transition shadow-xs ${
                  isUnread
                    ? "border-blue-200 bg-gradient-to-r from-blue-50/40 to-white dark:border-blue-900/60 dark:bg-gradient-to-r dark:from-blue-950/30 dark:to-slate-900"
                    : "border-slate-200 bg-white opacity-85 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                {/* Lado izquierdo: Icono y Contenido */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <NotificationIcon type={notification.type} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm ${
                          isUnread
                            ? "font-bold text-slate-900 dark:text-white"
                            : "font-semibold text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {notification.title}
                      </p>

                      {isUnread ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                          Nueva
                        </span>
                      ) : null}

                      {notification.ticket ? (
                        <Link
                          href={`/panel/ticket/${notification.ticket.id}`}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                        >
                          #{notification.ticket.code}
                        </Link>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                      {notification.body}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400 font-medium dark:text-slate-500">
                      {dateFormatter.format(new Date(notification.createdAt))}
                    </p>
                  </div>
                </div>

                {/* Lado derecho: Acciones */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  {notification.ticket ? (
                    <Link
                      href={`/panel/ticket/${notification.ticket.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                    >
                      Ver ticket
                    </Link>
                  ) : null}

                  {isUnread ? (
                    <button
                      type="button"
                      onClick={() => handleMarkOne(notification.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:bg-blue-800"
                    >
                      Marcar leída
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium px-2 py-1 dark:text-slate-500">
                      Leída
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
