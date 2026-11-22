"use client";

import { useActionState, useState } from "react";

import {
  createStaffUser,
  deleteStaffUser,
  resetStaffPassword,
  setStaffUserArea,
  setUserMailPassword,
  toggleStaffUser,
} from "@/app/actions/users";
import type { TicketArea } from "@/generated/prisma/enums";
import {
  AREAS,
  AREA_CONFIG,
  AREA_ICONS,
  AREA_LABELS,
  AREA_STYLES,
  ROLE_LABELS,
} from "@/lib/tickets";
import type { FormState } from "@/lib/validation";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  area: TicketArea;
  active: boolean;
  mailConnected: boolean;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/30";

function Feedback({ state }: { state: FormState }) {
  if (!state?.message) {
    return null;
  }

  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        state.ok
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
      }`}
    >
      {state.message}
    </p>
  );
}

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <ul className="mt-1.5 space-y-0.5 text-sm text-red-600 dark:text-red-400">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

export function UsersManager({ users }: { users: UserRow[] }) {
  const [createState, createAction, createPending] = useActionState<
    FormState,
    FormData
  >(createStaffUser, undefined);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Crear usuario
        </h2>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          El correo ingresado sera el usuario de acceso y recibira las
          notificaciones y la bienvenida automaticamente.
        </p>
        <form action={createAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user-name" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Nombre
            </label>
            <input
              id="user-name"
              name="name"
              required
              maxLength={80}
              className={inputClass}
            />
            <FieldErrors errors={createState?.errors?.name} />
          </div>
          <div>
            <label htmlFor="user-email" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Correo
            </label>
            <input
              id="user-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
            />
            <FieldErrors errors={createState?.errors?.email} />
          </div>
          <div>
            <label htmlFor="user-password" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Contrasena
            </label>
            <input
              id="user-password"
              name="password"
              type="password"
              required
              minLength={8}
              className={inputClass}
            />
            <FieldErrors errors={createState?.errors?.password} />
          </div>
          <div>
            <label htmlFor="user-role" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Rol
            </label>
            <select id="user-role" name="role" required defaultValue="agent" className={inputClass}>
              <option value="agent">Usuario</option>
              <option value="superadmin">Admin</option>
            </select>
            <FieldErrors errors={createState?.errors?.role} />
          </div>
          <div>
            <label htmlFor="user-area" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Área de la empresa
            </label>
            <select id="user-area" name="area" required defaultValue="tecnologia" className={inputClass}>
              {AREAS.map((item) => (
                <option key={item} value={item}>
                  {AREA_CONFIG[item].icon} {AREA_CONFIG[item].label}
                </option>
              ))}
            </select>
            <FieldErrors errors={createState?.errors?.area} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="user-mailpass" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Clave de aplicacion de Gmail (opcional - permite enviar los correos desde la cuenta del usuario)
            </label>
            <input
              id="user-mailpass"
              name="mailAppPassword"
              type="password"
              autoComplete="off"
              minLength={16}
              placeholder="16 caracteres generados en Google Cuenta > Seguridad > Claves de aplicacion"
              className={inputClass}
            />
            <FieldErrors errors={createState?.errors?.mailAppPassword} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {createPending ? "Creando..." : "Crear usuario"}
            </button>
          </div>
          <div className="sm:col-span-2">
            <Feedback state={createState} />
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Usuarios ({users.length})
          </h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((user) => (
            <li key={user.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${AREA_STYLES[user.area]}`}>
                      <span>{AREA_ICONS[user.area]}</span>
                      <span>{AREA_LABELS[user.area]}</span>
                    </span>
                    {!user.active ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/70 dark:text-red-300">
                        Desactivado
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 dark:text-slate-500">
                      Rol: {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    {user.mailConnected ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Gmail conectado
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Gmail no conectado</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ChangeAreaForm user={user} />
                  <MailPasswordForm user={user} />
                  <ToggleUserForm user={user} />
                  <ResetPasswordForm userId={user.id} userName={user.name} />
                  <DeleteUserForm user={user} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ChangeAreaForm({ user }: { user: UserRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    setStaffUserArea,
    undefined,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cambiar área
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <select
        name="area"
        defaultValue={user.area}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {AREAS.map((item) => (
          <option key={item} value={item}>
            {AREA_CONFIG[item].icon} {AREA_CONFIG[item].label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar área"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cancelar
      </button>
      <Feedback state={state} />
    </form>
  );
}

function MailPasswordForm({ user }: { user: UserRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    setUserMailPassword,
    undefined,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
      >
        {user.mailConnected ? "Cambiar Gmail" : "Conectar Gmail"}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <input
        name="mailAppPassword"
        type="password"
        autoComplete="off"
        placeholder={`Clave de aplicacion de ${user.email}`}
        className="w-52 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cancelar
      </button>
      <Feedback state={state} />
    </form>
  );
}

function ToggleUserForm({ user }: { user: UserRow }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    toggleStaffUser,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={user.id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {user.active ? "Desactivar" : "Activar"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function ResetPasswordForm({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resetStaffPassword,
    undefined,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="password"
        type="password"
        required
        minLength={8}
        placeholder={`Nueva clave de ${userName}`}
        className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Cambiar clave
      </button>
      <Feedback state={state} />
    </form>
  );
}

function DeleteUserForm({ user }: { user: UserRow }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    deleteStaffUser,
    undefined,
  );

  if (state?.ok) {
    return null;
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Eliminar
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <span className="text-xs font-medium text-red-600 dark:text-red-400">
        Eliminar a {user.name}?
      </span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Eliminando..." : "Si, eliminar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cancelar
      </button>
      {state?.message && !state.ok ? (
        <span className="text-xs text-red-600 dark:text-red-400">{state.message}</span>
      ) : null}
    </form>
  );
}
