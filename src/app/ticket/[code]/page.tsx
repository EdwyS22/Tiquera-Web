import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/db";
import { expireOverdueTickets } from "@/lib/ticket-service";
import {
  AREA_ICONS,
  AREA_LABELS,
  AREA_ROLES,
  AREA_STYLES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  formatRemaining,
  isOpenStatus,
} from "@/lib/tickets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return { title: `Ticket ${code} | Tiquera Web` };
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "long",
  timeStyle: "short",
});

export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Verificación en segundo plano sin ralentizar la respuesta al cliente
  expireOverdueTickets().catch((err) => {
    console.warn("[ticket] Aviso al expirar tickets automáticamente:", err);
  });

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: {
      assignedTo: { select: { name: true } },
      attachments: true,
      messages: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const isOpen = isOpenStatus(ticket.status);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8 sm:gap-6 sm:px-6 sm:py-12">
        <Link
          href="/panel"
          aria-label="Volver"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span className="text-base font-bold leading-none">&larr;</span>
        </Link>

        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Seguimiento de ticket
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
              {ticket.code}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${AREA_STYLES[ticket.area]}`}
            >
              <span>{AREA_ICONS[ticket.area]}</span>
              <span>{AREA_LABELS[ticket.area]}</span>
            </span>
            {ticket.product ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                <span>📦</span>
                <span>{ticket.product}</span>
              </span>
            ) : null}
            <span
              className={`inline-block rounded-full px-3 py-1.5 text-sm font-medium ${STATUS_STYLES[ticket.status]}`}
            >
              {STATUS_LABELS[ticket.status]}
            </span>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{ticket.title}</p>
        </header>

        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800">
          <div className="bg-white p-4 sm:p-5 dark:bg-slate-900">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Área de la empresa
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5">
                <span>{AREA_ICONS[ticket.area]}</span>
                <span>{AREA_LABELS[ticket.area]}</span>
              </span>
              <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">{AREA_ROLES[ticket.area]}</p>
            </dd>
          </div>
          {ticket.product ? (
            <div className="bg-white p-4 sm:p-5 dark:bg-slate-900">
              <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Producto / Servicio
              </dt>
              <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                📦 {ticket.product}
              </dd>
            </div>
          ) : null}
          <div className="bg-white p-4 sm:p-5 dark:bg-slate-900">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Sitio afectado
            </dt>
            <dd className="mt-1 break-words font-medium text-slate-800 dark:text-slate-200">{ticket.landingUrl}</dd>
          </div>
          <div className="bg-white p-4 sm:p-5 dark:bg-slate-900">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Categoria
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {CATEGORY_LABELS[ticket.category]}
            </dd>
          </div>
          <div className="bg-white p-4 sm:p-5 dark:bg-slate-900">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Prioridad
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[ticket.priority]}`}
              >
                {PRIORITY_LABELS[ticket.priority]}
              </span>
            </dd>
          </div>
          <div className="bg-white p-4 sm:p-5 dark:bg-slate-900">
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {isOpen ? "Tiempo restante de SLA" : "Cerrado"}
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {isOpen
                ? formatRemaining(ticket.dueAt)
                : ticket.closedAt
                  ? dateFormatter.format(ticket.closedAt)
                  : "-"}
            </dd>
          </div>
        </dl>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Descripcion del problema
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {ticket.description}
          </p>
        </section>

        {ticket.attachments.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Evidencias adjuntas
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ticket.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                  >
                    {attachment.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {ticket.messages.length > 0 ? (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6 dark:border-blue-900/60 dark:bg-blue-950/30">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              Mensajes del equipo
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {ticket.messages.map((message) => (
                <li
                  key={message.id}
                  className="rounded-xl border border-blue-200 bg-white p-4 dark:border-blue-900/40 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {message.author?.name ?? "Soporte"}
                    </span>
                    <span>{dateFormatter.format(message.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {message.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!isOpen && ticket.resolutionNotes ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6 dark:border-emerald-800 dark:bg-emerald-950/40">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Resolucion
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
              {ticket.resolutionNotes}
            </p>
          </section>
        ) : null}

        {!isOpen ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-5 sm:p-6 shadow-sm dark:border-blue-900/50 dark:bg-gradient-to-r dark:from-slate-900 dark:to-blue-950/40">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Documento de Cierre Oficial
              </p>
              <h3 className="mt-1 font-bold text-slate-900 dark:text-white">
                Informe técnico del ticket #{ticket.code}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Descarga el resumen completo con la resolución y tiempos de atención para tu constancia.
              </p>
            </div>
            <a
              href={`/api/tickets/${ticket.code}/pdf`}
              download
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
            >
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Descargar informe PDF
            </a>
          </div>
        ) : null}

        <p className="text-sm text-slate-500 dark:text-slate-400">
          &iquest;Necesitas reportar algo?{" "}
          <Link
            href="/panel/nuevo"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Crea un nuevo ticket
          </Link>
        </p>

        <footer className="mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <p>
            Sistema oficial de soporte y atención desarrollado para{" "}
            <strong className="font-semibold text-slate-700 dark:text-slate-300">Vionest Services</strong>
          </p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} Vionest Services. Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </>
  );
}
