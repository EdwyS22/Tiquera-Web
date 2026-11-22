import Image from "next/image";
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Acceso del equipo | Tiquera Web",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8 transition-colors duration-150">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo Vionest Service"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
            unoptimized
          />
          <div>
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-lg block leading-tight">
              Tiquera Web
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">
              Vionest Service
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Panel del equipo</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Inicia sesión con tu correo institucional de Vionest Service.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Plataforma oficial desarrollada para Vionest Service &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
