"use client";

import { useActionState } from "react";

import { login } from "@/app/actions/auth";
import type { FormState } from "@/lib/validation";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.message ? (
        <p className="rounded-lg bg-red-50 dark:bg-red-950/60 px-4 py-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Correo institucional
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950/50 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Contrasena
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-950/50 sm:text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
      >
        {pending ? "Entrando..." : "Entrar al panel"}
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Acceso exclusivo del equipo tecnico de Vionest.
      </p>
    </form>
  );
}