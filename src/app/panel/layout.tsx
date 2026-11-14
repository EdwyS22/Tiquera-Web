import Image from "next/image";
import Link from "next/link";

import { NotificationsBell } from "@/components/notifications-bell";
import { PanelUserMenu } from "@/components/panel-user-menu";
import { requireStaff } from "@/lib/dal";
import { ROLE_LABELS } from "@/lib/tickets";

export default async function PanelLayout({
  children,
}: LayoutProps<"/panel">) {
  const staff = await requireStaff();
  const isSuperadmin = staff.role === "superadmin";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 sm:h-16 w-full items-center justify-between px-4 sm:px-8 xl:px-12">
          {/* Logo y Enlaces de Escritorio */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/panel"
              className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 focus:outline-none"
            >
              <Image
                src="/logo.png"
                alt="Logo Tiquera Web"
                width={38}
                height={38}
                className="h-9 w-9 object-contain"
                priority
                unoptimized
              />
              <span className="font-bold tracking-tight">Tiquera Web</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                href="/panel"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Panel
              </Link>
              <Link
                href="/panel/nuevo"
                className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Nuevo ticket
              </Link>
              {isSuperadmin ? (
                <Link
                  href="/panel/usuarios"
                  className="rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Usuarios
                </Link>
              ) : null}
            </nav>
          </div>

          {/* Acciones del Navbar: Notificaciones + Mini Menú Desplegable */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationsBell />
            <PanelUserMenu
              name={staff.name}
              roleLabel={ROLE_LABELS[staff.role]}
              isSuperadmin={isSuperadmin}
            />
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-4 py-4 sm:px-8 sm:py-6 xl:px-12">
        {children}
      </main>
    </div>
  );
}
