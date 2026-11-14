"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { logout } from "@/app/actions/auth";

type PanelUserMenuProps = {
  name: string;
  roleLabel: string;
  isSuperadmin: boolean;
};

export function PanelUserMenu({
  name,
  roleLabel,
  isSuperadmin,
}: PanelUserMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Iniciales del nombre (ej: "ER" o "AD")
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  const closeMenu = () => {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  // Cierre robusto al hacer clic o tocar fuera del menú
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

  return (
    <details
      ref={detailsRef}
      data-panel-dropdown
      onToggle={handleToggle}
      className="relative group"
    >
      {/* Botón del Menú (<summary> nativo, sin nested buttons) */}
      <summary
        aria-label="Abrir menú de usuario"
        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:bg-slate-100 list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white shadow-xs pointer-events-none">
          {initials || "U"}
        </span>

        <span className="hidden text-left sm:block pointer-events-none">
          <span className="block text-xs font-semibold text-slate-800 leading-tight">
            {name}
          </span>
          <span className="block text-[10px] text-slate-500 font-medium leading-tight">
            {roleLabel}
          </span>
        </span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 group-open:rotate-180 pointer-events-none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </summary>

      {/* Menú Desplegable */}
      <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-24px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl">
        {/* Cabecera del usuario (Solo nombre y rol, CERO correos) */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
          <div>
            <p className="text-sm font-bold text-slate-900 leading-snug">{name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-600">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Botón cerrar en móvil */}
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Cerrar menú"
            className="sm:hidden -mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
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

        {/* Enlaces de Navegación */}
        <div className="py-1">
          <Link
            href="/panel"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 active:bg-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-4 w-4 text-slate-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
              />
            </svg>
            Vista General / Panel
          </Link>

          <Link
            href="/panel/nuevo"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 active:bg-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-4 w-4 text-slate-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Nuevo ticket
          </Link>

          {isSuperadmin ? (
            <Link
              href="/panel/usuarios"
              onClick={closeMenu}
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 active:bg-slate-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-4 w-4 text-slate-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
              Gestión de usuarios
            </Link>
          ) : null}

          <Link
            href="/panel/notificaciones"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 active:bg-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-4 w-4 text-slate-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
            Notificaciones
          </Link>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="border-t border-slate-100 pt-1">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50 active:bg-red-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-4 w-4 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
