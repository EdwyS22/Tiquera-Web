import Link from "next/link";
import type { Metadata } from "next";

import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/staff";
import { requireStaff } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Notificaciones | Tiquera Web",
};

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

function NotificationIcon({ type }: { type: string }) {
  if (type === "ticket_closed") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50">
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-4 ring-amber-50">
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
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-4 ring-blue-50">
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

export default async function NotificationsPage() {
  const staff = await requireStaff();

  const notifications = await prisma.notification.findMany({
    where: { recipientId: staff.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      ticket: { select: { id: true, code: true } },
    },
  });

  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-4xl mx-auto">
      <Link
        href="/panel"
        aria-label="Volver al panel"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
      >
        <span className="text-base font-bold leading-none">&larr;</span>
      </Link>

      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Centro de Notificaciones
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {unread > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Tienes {unread} notificación{unread === 1 ? "" : "es"} sin leer
              </span>
            ) : (
              "Estás al día con todos tus tickets y avisos."
            )}
          </p>
        </div>

        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:bg-slate-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4 text-emerald-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              Marcar todas como leídas
            </button>
          </form>
        ) : null}
      </header>

      {/* Lista de Notificaciones */}
      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
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
          <p className="text-base font-semibold text-slate-800">
            Sin notificaciones pendientes
          </p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Aquí aparecerán las actualizaciones y asignaciones de tus casos.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const isUnread = !notification.readAt;

            return (
              <li
                key={notification.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 sm:p-5 transition shadow-xs ${
                  isUnread
                    ? "border-blue-200 bg-gradient-to-r from-blue-50/40 to-white"
                    : "border-slate-200 bg-white opacity-85 hover:opacity-100"
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
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-800"
                        }`}
                      >
                        {notification.title}
                      </p>

                      {isUnread ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          Nueva
                        </span>
                      ) : null}

                      {notification.ticket ? (
                        <Link
                          href={`/panel/ticket/${notification.ticket.id}`}
                          className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                        >
                          #{notification.ticket.code}
                        </Link>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {notification.body}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400 font-medium">
                      {dateFormatter.format(notification.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Lado derecho: Acciones */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {notification.ticket ? (
                    <Link
                      href={`/panel/ticket/${notification.ticket.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-600"
                    >
                      Ver ticket
                    </Link>
                  ) : null}

                  {isUnread ? (
                    <form
                      action={markNotificationRead.bind(null, notification.id)}
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:bg-blue-800"
                      >
                        Marcar leída
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium px-2 py-1">
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
