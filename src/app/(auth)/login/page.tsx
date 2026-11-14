import Image from "next/image";
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Acceso del equipo | Tiquera Web",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo Tiquera Web"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
            unoptimized
          />
          <div>
            <span className="font-bold tracking-tight text-slate-900 text-lg block leading-tight">
              Tiquera Web
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Sistema de Tickets
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Panel del equipo</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Inicia sesion con tu correo institucional.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
