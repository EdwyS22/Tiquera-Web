import Image from "next/image";
import Link from "next/link";

import { NotificationsBell } from "@/components/notifications-bell";
import { PanelNav } from "@/components/panel-nav";
import { PanelUserMenu } from "@/components/panel-user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireStaff } from "@/lib/dal";
import { ROLE_LABELS } from "@/lib/tickets";

export default async function PanelLayout({
  children,
}: LayoutProps<"/panel">) {
  const staff = await requireStaff();
  const isSuperadmin = staff.role === "superadmin";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors duration-150">
        <div className="flex h-14 sm:h-16 w-full items-center justify-between px-4 sm:px-8 xl:px-12">
          {/* Logo y Enlaces de Escritorio */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/panel"
              className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white focus:outline-none"
            >
              <Image
                src="/logo.png"
                alt="Logo Vionest Service"
                width={38}
                height={38}
                className="h-9 w-9 object-contain"
                priority
                unoptimized
              />
              <div className="flex flex-col">
                <span className="font-bold tracking-tight leading-tight text-slate-900 dark:text-white">Tiquera Web</span>
                <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                  Vionest Service
                </span>
              </div>
            </Link>

            <PanelNav isSuperadmin={isSuperadmin} />
          </div>

          {/* Acciones del Navbar: Modo Oscuro + Notificaciones + Mini Menú Desplegable */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationsBell />
            <PanelUserMenu
              name={staff.name}
              roleLabel={ROLE_LABELS[staff.role]}
              isSuperadmin={isSuperadmin}
            />
          </div>
        </div>

        {/* Barra de navegación móvil (visible en pantallas móviles < sm) */}
        <div className="flex sm:hidden border-t border-slate-100 dark:border-slate-800 px-3 py-1.5 bg-slate-50/70 dark:bg-slate-900/70">
          <PanelNav isSuperadmin={isSuperadmin} mobile />
        </div>
      </header>

      <main className="w-full flex-1 px-4 py-4 sm:px-8 sm:py-6 xl:px-12">
        {children}
      </main>
    </div>
  );
}
