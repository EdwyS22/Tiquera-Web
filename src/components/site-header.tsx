import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/80 backdrop-blur transition-colors duration-150">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/panel"
          className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900 dark:text-white"
        >
          <Image
            src="/logo.png"
            alt="Logo Vionest Services"
            width={38}
            height={38}
            className="h-9 w-9 object-contain"
            priority
            unoptimized
          />
          <div className="flex flex-col">
            <span className="leading-tight text-slate-900 dark:text-white">Tiquera Web</span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Vionest Services
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <ThemeToggle />
          <Link
            href="/panel"
            className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Panel
          </Link>
          <Link
            href="/panel/nuevo"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            Nuevo ticket
          </Link>
        </nav>
      </div>
    </header>
  );
}
