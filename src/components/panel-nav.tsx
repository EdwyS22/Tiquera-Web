"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PanelNavProps = {
  isSuperadmin: boolean;
  mobile?: boolean;
};

export function PanelNav({ isSuperadmin, mobile = false }: PanelNavProps) {
  const pathname = usePathname();

  const isPanelActive =
    pathname === "/panel" || pathname.startsWith("/panel/ticket/");
  const isNuevoActive = pathname === "/panel/nuevo";
  const isUsuariosActive = pathname.startsWith("/panel/usuarios");

  const navItems = [
    {
      href: "/panel",
      label: "Panel",
      isActive: isPanelActive,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.9}
          stroke="currentColor"
          className={mobile ? "h-3.5 w-3.5" : "h-4 w-4"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      ),
    },
    {
      href: "/panel/nuevo",
      label: "Crear ticket",
      isActive: isNuevoActive,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={mobile ? "h-3.5 w-3.5" : "h-4 w-4"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      ),
    },
    ...(isSuperadmin
      ? [
          {
            href: "/panel/usuarios",
            label: "Usuarios",
            isActive: isUsuariosActive,
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.9}
                stroke="currentColor"
                className={mobile ? "h-3.5 w-3.5" : "h-4 w-4"}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
            ),
          },
        ]
      : []),
  ];

  if (mobile) {
    return (
      <nav
        className="flex w-full items-center gap-1.5 text-xs py-0.5 overflow-x-auto"
        aria-label="Navegación móvil del panel"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              item.isActive
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      className="hidden sm:flex items-center gap-1 text-sm"
      aria-label="Navegación principal del panel"
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.isActive ? "page" : undefined}
          className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-medium transition-all ${
            item.isActive
              ? "bg-blue-50 text-blue-700 font-semibold shadow-2xs border border-blue-200/80"
              : "text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span
            className={
              item.isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            }
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
          {item.isActive && (
            <span
              className="ml-0.5 h-1.5 w-1.5 rounded-full bg-blue-600"
              aria-hidden="true"
            />
          )}
        </Link>
      ))}
    </nav>
  );
}
