import Link from "next/link";
import type { Metadata } from "next";

import { ReportForm } from "@/components/report-form";
import { requireStaff } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Nuevo ticket | Tiquera Web",
};

export default async function NewTicketPage() {
  await requireStaff();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 sm:gap-6">
      <Link
        href="/panel"
        aria-label="Volver al panel"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <span className="text-base font-bold leading-none">&larr;</span>
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Nuevo ticket</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Registra un reporte en nombre del cliente. Quedaras registrado como
          creador del ticket (visible solo para superadmins).
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <ReportForm staffMode />
      </div>
    </div>
  );
}
