import Link from "next/link";
import type { Metadata } from "next";

import { UsersManager } from "@/components/users-manager";
import { requireSuperadmin } from "@/lib/dal";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Usuarios | Tiquera Web",
};

export default async function UsersPage() {
  await requireSuperadmin();

  const users = await prisma.staffUser.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      area: true,
      active: true,
      mailAppPassword: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const rows = users.map(({ mailAppPassword, ...user }) => ({
    ...user,
    mailConnected: Boolean(mailAppPassword),
  }));

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <Link
        href="/panel"
        aria-label="Volver al panel"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
      >
        <span className="text-base font-bold leading-none">&larr;</span>
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight">Gestion de usuarios</h1>
        <p className="mt-1 text-sm text-slate-600">
          Solo visible para admins. Cada usuario se conecta con el correo con el
          que fue creado para recibir notificaciones.
        </p>
      </header>

      <UsersManager users={rows} />
    </div>
  );
}
