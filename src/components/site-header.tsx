import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/panel"
          className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900"
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
            <span className="leading-tight">Tiquera Web</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              Vionest Service
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/panel"
            className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
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
