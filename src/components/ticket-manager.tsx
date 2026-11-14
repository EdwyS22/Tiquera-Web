"use client";

import { useActionState, useState } from "react";

import {
  addTicketNote,
  assignTicket,
  messageTicketClient,
  resolveTicket,
  setTicketStatus,
  updateTicket,
} from "@/app/actions/staff";
import {
  AREAS,
  AREA_CONFIG,
  AREA_ICONS,
  AREA_LABELS,
  AREA_ROLES,
  AREA_STYLES,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  formatRemaining,
  isOpenStatus,
  type StaffRole,
  type TicketArea,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/tickets";
import type { FormState } from "@/lib/validation";

type StaffOption = {
  id: string;
  name: string;
  area?: TicketArea;
  role?: StaffRole;
};

export type TicketMessageItem = {
  id: string;
  body: string;
  createdAt: Date;
  emailSent?: boolean;
  author: { name: string } | null;
};

export type TicketNoteItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string } | null;
};

export type TicketAttachmentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
};

export type TicketFullData = {
  id: string;
  code: string;
  title: string;
  description: string;
  landingUrl: string;
  reporterEmail: string;
  area: TicketArea;
  product?: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  dueAt: Date;
  createdAt: Date;
  closedAt?: Date | null;
  resolutionNotes?: string | null;
  assignedTo?: { id: string; name: string } | null;
  createdBy?: { name: string; email: string } | null;
  attachments: TicketAttachmentItem[];
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Feedback({ state }: { state: FormState }) {
  if (state?.message) {
    return (
      <p
        className={`rounded-lg px-3 py-2 text-xs font-medium ${
          state.ok
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}
      >
        {state.message}
      </p>
    );
  }

  return null;
}

function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return (
    <ul className="mt-1 space-y-0.5 text-xs text-red-600">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TicketManager({
  ticket,
  staffList,
  messages = [],
  notes = [],
}: {
  ticket: TicketFullData;
  staffList: StaffOption[];
  messages?: TicketMessageItem[];
  notes?: TicketNoteItem[];
}) {
  const open = isOpenStatus(ticket.status);
  const manageableStatus =
    ticket.status === "in_progress" || ticket.status === "in_review"
      ? ticket.status
      : "pending";

  const [assignState, assignAction, assignPending] = useActionState<
    FormState,
    FormData
  >(assignTicket, undefined);

  const [statusState, statusAction, statusPending] = useActionState<
    FormState,
    FormData
  >(setTicketStatus, undefined);

  const [noteState, noteAction, notePending] = useActionState<FormState, FormData>(
    addTicketNote,
    undefined,
  );

  const [messageState, messageAction, messagePending] = useActionState<
    FormState,
    FormData
  >(messageTicketClient, undefined);

  const [editState, editAction, editPending] = useActionState<
    FormState,
    FormData
  >(updateTicket, undefined);

  const [resolveState, resolveAction, resolvePending] = useActionState<
    FormState,
    FormData
  >(resolveTicket, undefined);

  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [editArea, setEditArea] = useState<TicketArea>(ticket.area);
  const [editProduct, setEditProduct] = useState<string>(ticket.product || "");
  const [activeTab, setActiveTab] = useState<"client" | "internal" | "resolve" | "columns">("client");

  // Regla de asignación estricta: Solo administradores o personal del área del ticket
  const eligibleStaffList = staffList.filter((s) => {
    const isAdmin = s.role === "admin" || s.role === "superadmin";
    const isSameArea = s.area === ticket.area;
    return isAdmin || isSameArea;
  });

  const areaAgents = eligibleStaffList.filter(
    (s) => s.area === ticket.area && s.role === "agent",
  );
  const adminUsers = eligibleStaffList.filter(
    (s) => s.role === "admin" || s.role === "superadmin",
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] 2xl:grid-cols-[450px_1fr] items-start">
      {/* ========================================================================= */}
      {/* ⚙️ COLUMNA IZQUIERDA: PARÁMETROS DEL TICKET CON EL MÁXIMO ORDEN           */}
      {/* ========================================================================= */}
      <aside className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs lg:sticky lg:top-20">
        {/* Cabecera del Panel de Parámetros */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>⚙️</span>
              <span>Parámetros del Ticket</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowEditForm(!showEditForm)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              {showEditForm ? "Cerrar edición" : "✏️ Editar"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Estado, asignación y metadatos del caso
          </p>
        </div>

        {/* 1. ESTADO ACTUAL (CON SELECTOR RÁPIDO) */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 shadow-xs">
          <form action={statusAction} className="flex flex-col gap-1.5">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Estado
              </label>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLES[ticket.status]}`}
              >
                {STATUS_LABELS[ticket.status]}
              </span>
            </div>
            {open ? (
              <div className="flex gap-1.5 mt-1">
                <select
                  name="status"
                  defaultValue={manageableStatus}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="pending">⏳ Pendiente</option>
                  <option value="in_progress">⚡ En Proceso</option>
                  <option value="in_review">🔍 En Revisión</option>
                </select>
                <button
                  type="submit"
                  disabled={statusPending}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 shrink-0 disabled:opacity-50 transition"
                >
                  {statusPending ? "..." : "Actualizar"}
                </button>
              </div>
            ) : null}
            <Feedback state={statusState} />
          </form>
        </div>

        {/* 2. ESPECIALISTA ASIGNADO (CON SELECTOR RÁPIDO) */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 shadow-xs">
          <form action={assignAction} className="flex flex-col gap-1.5">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Asignado a
              </label>
              <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[160px]">
                {ticket.assignedTo ? ticket.assignedTo.name : "⚠️ Sin asignar"}
              </span>
            </div>
            <div className="flex gap-1.5 mt-1">
              <select
                name="assignedToId"
                defaultValue={ticket.assignedTo?.id ?? ""}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="">Sin asignar (En espera)</option>
                {areaAgents.length > 0 ? (
                  <optgroup label={`Personal de ${AREA_LABELS[ticket.area]}`}>
                    {areaAgents.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        👤 {staff.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {adminUsers.length > 0 ? (
                  <optgroup label="Administradores">
                    {adminUsers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        👑 {staff.name} ({staff.role === "superadmin" ? "Superadmin" : "Admin"})
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
              <button
                type="submit"
                disabled={assignPending}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 shrink-0 disabled:opacity-50 transition"
              >
                {assignPending ? "..." : "Asignar"}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              🔒 Solo asignable a personal de {AREA_LABELS[ticket.area]} o administradores. Para asignar a otro trabajador, mueve el ticket de área.
            </p>
            <Feedback state={assignState} />
          </form>
        </div>

        {/* 3. PARÁMETROS TÉCNICOS ORGANIZADOS */}
        <div className="flex flex-col divide-y divide-slate-100 text-xs">
          {/* Prioridad */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Prioridad</span>
            <span
              className={`rounded-md px-2 py-0.5 font-bold text-[11px] ${PRIORITY_STYLES[ticket.priority]}`}
            >
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>

          {/* Área de la Empresa */}
          <div className="py-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Área</span>
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${AREA_STYLES[ticket.area]}`}
              >
                <span>{AREA_ICONS[ticket.area]}</span>
                <span>{AREA_LABELS[ticket.area]}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {AREA_ROLES[ticket.area]}
            </p>
          </div>

          {/* Producto o Servicio */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Producto / Servicio</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">
              {ticket.product ? `📦 ${ticket.product}` : "Consulta general"}
            </span>
          </div>

          {/* Categoría */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Categoría</span>
            <span className="font-semibold text-slate-800">
              {CATEGORY_LABELS[ticket.category]}
            </span>
          </div>

          {/* SLA Restante */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">SLA Restante</span>
            <span className="font-bold text-slate-900">
              {open ? `⏱ ${formatRemaining(new Date(ticket.dueAt))}` : "Cerrado"}
            </span>
          </div>

          {/* Fecha Límite SLA */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Límite SLA</span>
            <span className="text-slate-700">
              {dateFormatter.format(new Date(ticket.dueAt))}
            </span>
          </div>

          {/* Fecha de creación */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Creado</span>
            <span className="text-slate-700">
              {dateFormatter.format(new Date(ticket.createdAt))}
            </span>
          </div>

          {/* Correo del Cliente */}
          <div className="py-2.5 flex flex-col gap-0.5">
            <span className="text-slate-500 font-medium">Reportado por</span>
            <span className="font-semibold text-slate-800 break-all">
              {ticket.reporterEmail}
            </span>
          </div>

          {/* Página afectada */}
          <div className="py-2.5 flex flex-col gap-0.5">
            <span className="text-slate-500 font-medium">Página afectada</span>
            <a
              href={ticket.landingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline break-all font-medium text-[11px] inline-flex items-center gap-1"
            >
              <span>{ticket.landingUrl}</span>
              <span>↗</span>
            </a>
          </div>

          {/* Registrado por */}
          {ticket.createdBy ? (
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Registrado por</span>
              <span className="font-medium text-slate-700 truncate max-w-[160px]">
                {ticket.createdBy.name}
              </span>
            </div>
          ) : null}
        </div>

        {/* Acceso directo al PDF si el ticket está cerrado */}
        {!open && ticket.closedAt ? (
          <div className="pt-2 border-t border-slate-100">
            <a
              href={`/api/tickets/${ticket.code}/pdf`}
              download
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <span>📄</span>
              <span>Descargar PDF Oficial</span>
            </a>
          </div>
        ) : null}
      </aside>

      {/* ========================================================================= */}
      {/* 📋 COLUMNA DERECHA: CONTENIDO Y APARTADOS JUNTOS EN UN ESPACIO ORDENADO   */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-6">
        {/* Descripción del problema y Evidencias adjuntas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Descripción detallada del problema
          </h2>
          <p className="mt-2.5 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-normal">
            {ticket.description}
          </p>

          {/* Evidencias adjuntas */}
          {ticket.attachments && ticket.attachments.length > 0 ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Evidencias y capturas adjuntas ({ticket.attachments.length})
              </h3>
              <ul className="flex flex-wrap gap-2.5">
                {ticket.attachments.map((att) => {
                  const isImage =
                    att.fileType?.startsWith("image/") ||
                    /\.(png|jpe?g|webp|gif)$/i.test(att.fileName);

                  return (
                    <li key={att.id}>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      >
                        <span>{isImage ? "🖼️" : "📎"}</span>
                        <span className="truncate max-w-[220px]">{att.fileName}</span>
                        <span className="text-[11px] text-slate-400">↗</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Nota de resolución oficial si el ticket ya fue completado */}
        {ticket.resolutionNotes ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <span>✓</span>
              <h2>Resolución aplicada</h2>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-950 font-medium">
              {ticket.resolutionNotes}
            </p>
          </section>
        ) : null}

        {/* Formulario de edición rápida colapsable */}
        {showEditForm ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Modificar datos del reporte
              </h2>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕ Cerrar
              </button>
            </div>
            <form action={editAction} className="flex flex-col gap-4">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-title" className="text-xs font-medium text-slate-600">
                    Título
                  </label>
                  <input
                    id="edit-title"
                    name="title"
                    required
                    maxLength={140}
                    defaultValue={ticket.title}
                    className={inputClass}
                  />
                  <FieldErrors errors={editState?.errors?.title} />
                </div>

                <div>
                  <label htmlFor="edit-landingUrl" className="text-xs font-medium text-slate-600">
                    URL afectada
                  </label>
                  <input
                    id="edit-landingUrl"
                    name="landingUrl"
                    type="url"
                    required
                    defaultValue={ticket.landingUrl}
                    className={inputClass}
                  />
                  <FieldErrors errors={editState?.errors?.landingUrl} />
                </div>

                <div>
                  <label htmlFor="edit-reporterEmail" className="text-xs font-medium text-slate-600">
                    Correo del cliente
                  </label>
                  <input
                    id="edit-reporterEmail"
                    name="reporterEmail"
                    type="email"
                    required
                    defaultValue={ticket.reporterEmail}
                    className={inputClass}
                  />
                  <FieldErrors errors={editState?.errors?.reporterEmail} />
                </div>

                <div>
                  <label htmlFor="edit-area" className="text-xs font-medium text-slate-600">
                    Área de la empresa
                  </label>
                  <select
                    id="edit-area"
                    name="area"
                    required
                    value={editArea}
                    onChange={(e) => {
                      setEditArea(e.target.value as TicketArea);
                      setEditProduct("");
                    }}
                    className={inputClass}
                  >
                    {AREAS.map((item) => (
                      <option key={item} value={item}>
                        {AREA_CONFIG[item].icon} {AREA_CONFIG[item].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-product" className="text-xs font-medium text-slate-600">
                    Producto o Servicio
                  </label>
                  <select
                    id="edit-product"
                    name="product"
                    value={editProduct}
                    onChange={(e) => setEditProduct(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">(Consulta general / No aplica)</option>
                    {AREA_CONFIG[editArea]?.products.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-category" className="text-xs font-medium text-slate-600">
                      Categoría
                    </label>
                    <select
                      id="edit-category"
                      name="category"
                      required
                      defaultValue={ticket.category}
                      className={inputClass}
                    >
                      <option value="funcionalidad">Funcionalidad</option>
                      <option value="diseno">Diseño</option>
                      <option value="contenido">Contenido</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-priority" className="text-xs font-medium text-slate-600">
                      Prioridad
                    </label>
                    <select
                      id="edit-priority"
                      name="priority"
                      required
                      defaultValue={ticket.priority}
                      className={inputClass}
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="edit-description" className="text-xs font-medium text-slate-600">
                  Descripción
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  required
                  minLength={15}
                  maxLength={4000}
                  rows={3}
                  defaultValue={ticket.description}
                  className={inputClass}
                />
                <FieldErrors errors={editState?.errors?.description} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={editPending}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-700 disabled:opacity-60"
                >
                  {editPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
              <Feedback state={editState} />
            </form>
          </section>
        ) : null}

        {/* ========================================================================= */}
        {/* 🎛️ ESPACIO DE ACCIONES UNIFICADO (JUNTOS CON EL MÁXIMO ORDEN EN PESTAÑAS)   */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          {/* Navegación por pestañas para mantener el orden y evitar scroll */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-5">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("client")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "client"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>💬</span>
                <span>Comunicación con Cliente</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                    activeTab === "client"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {messages.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("internal")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "internal"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>📝</span>
                <span>Notas Internas</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                    activeTab === "internal"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {notes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("resolve")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeTab === "resolve"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>🎯</span>
                <span>Cierre Oficial</span>
                {!open ? (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                    Cerrado
                  </span>
                ) : null}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "columns" ? "client" : "columns")}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === "columns"
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{activeTab === "columns" ? "📂 Vista en Pestañas" : "📑 Ver en Columnas"}</span>
            </button>
          </div>

          {/* VISTA 1: COMUNICACIÓN CON EL CLIENTE */}
          {activeTab === "client" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>💬</span>
                  <span>Mensajes Directos al Cliente</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Envía solicitudes, preguntas o actualizaciones. El cliente recibe una notificación por correo electrónico.
                </p>
              </div>

              <form action={messageAction} className="flex flex-col gap-3">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <textarea
                  name="body"
                  rows={4}
                  maxLength={4000}
                  placeholder="Escribe un mensaje o solicitud para el cliente..."
                  className={inputClass}
                  required
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    disabled={messagePending}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {messagePending ? "Enviando correo..." : "Enviar mensaje y correo"}
                  </button>
                </div>
                <Feedback state={messageState} />
              </form>

              {/* Historial de mensajes */}
              {messages.length > 0 ? (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Historial de mensajes enviados ({messages.length})
                  </h4>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span className="font-bold text-slate-800">
                          {msg.author?.name ?? "Usuario"}
                        </span>
                        <span>
                          {dateFormatter.format(new Date(msg.createdAt))}
                          {msg.emailSent ? " · ✉️ Correo enviado" : ""}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-800 text-xs leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Aún no se han enviado mensajes al cliente para este ticket.
                </p>
              )}
            </div>
          )}

          {/* VISTA 2: NOTAS INTERNAS DEL EQUIPO */}
          {activeTab === "internal" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>📝</span>
                  <span>Bitácora Interna del Equipo</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Notas confidenciales visibles exclusivamente para el personal técnico y administrativo.
                </p>
              </div>

              <form action={noteAction} className="flex flex-col gap-3">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <textarea
                  name="body"
                  rows={4}
                  maxLength={2000}
                  placeholder="Añade contexto técnico, hallazgos o acuerdos internos..."
                  className={inputClass}
                  required
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    disabled={notePending}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-60"
                  >
                    {notePending ? "Guardando..." : "Guardar nota interna"}
                  </button>
                </div>
                <Feedback state={noteState} />
              </form>

              {/* Historial de notas */}
              {notes.length > 0 ? (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Historial de notas del equipo ({notes.length})
                  </h4>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span className="font-bold text-slate-800">
                          {note.author?.name ?? "Usuario"}
                        </span>
                        <span>
                          {dateFormatter.format(new Date(note.createdAt))}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-800 text-xs leading-relaxed">
                        {note.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Aún no hay notas internas registradas para este ticket.
                </p>
              )}
            </div>
          )}

          {/* VISTA 3: CIERRE OFICIAL DEL TICKET */}
          {activeTab === "resolve" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Cierre Oficial y Resolución del Caso</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Al completar la atención, redacta la nota de resolución técnica. Se marcará como cumplido y se generará el PDF oficial.
                </p>
              </div>

              {open ? (
                <form action={resolveAction} className="flex flex-col gap-3">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <label htmlFor="tabResolutionNotes" className="text-xs font-semibold text-slate-700">
                    Solución aplicada y verificación técnica:
                  </label>
                  <textarea
                    id="tabResolutionNotes"
                    name="resolutionNotes"
                    rows={5}
                    maxLength={4000}
                    placeholder="Describe la solución realizada, qué se corrigió y cómo se verificó..."
                    className={inputClass}
                    required
                  />
                  <button
                    type="submit"
                    disabled={resolvePending}
                    className="w-full sm:w-fit rounded-lg bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {resolvePending ? "Cerrando..." : "✓ Marcar como cumplido y cerrar ticket"}
                  </button>
                  <Feedback state={resolveState} />
                </form>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-5 text-center">
                  <span className="text-3xl">🎉</span>
                  <h4 className="mt-2 font-bold text-sm text-emerald-950">
                    Ticket cerrado y completado
                  </h4>
                  <p className="mt-1 text-xs text-emerald-700">
                    Este ticket fue cerrado satisfactoriamente. El informe oficial en PDF se encuentra disponible para descarga.
                  </p>
                  <div className="mt-4">
                    <a
                      href={`/api/tickets/${ticket.code}/pdf`}
                      download
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      <span>📄</span>
                      <span>Descargar informe PDF</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA 4: TODAS LAS COLUMNAS LADO A LADO */}
          {activeTab === "columns" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Subcolumna 1: Mensajes */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span>💬</span>
                      <span>Mensajes al Cliente</span>
                    </h4>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {messages.length}
                    </span>
                  </div>
                  <form action={messageAction} className="flex flex-col gap-2">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <textarea
                      name="body"
                      rows={3}
                      maxLength={4000}
                      placeholder="Mensaje o solicitud para el cliente..."
                      className={inputClass}
                      required
                    />
                    <button
                      type="submit"
                      disabled={messagePending}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60"
                    >
                      {messagePending ? "Enviando..." : "Enviar mensaje"}
                    </button>
                    <Feedback state={messageState} />
                  </form>
                  {messages.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {messages.map((m) => (
                        <div key={m.id} className="rounded-lg border border-blue-200 bg-white p-2.5 text-xs">
                          <p className="font-semibold text-[11px] text-slate-700">{m.author?.name ?? "Usuario"}</p>
                          <p className="text-slate-600 mt-1 whitespace-pre-wrap">{m.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Subcolumna 2: Notas */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span>📝</span>
                      <span>Notas Internas</span>
                    </h4>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {notes.length}
                    </span>
                  </div>
                  <form action={noteAction} className="flex flex-col gap-2">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <textarea
                      name="body"
                      rows={3}
                      maxLength={2000}
                      placeholder="Contexto técnico o acuerdos internos..."
                      className={inputClass}
                      required
                    />
                    <button
                      type="submit"
                      disabled={notePending}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-60"
                    >
                      {notePending ? "Guardando..." : "Agregar nota"}
                    </button>
                    <Feedback state={noteState} />
                  </form>
                  {notes.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {notes.map((n) => (
                        <div key={n.id} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                          <p className="font-semibold text-[11px] text-slate-700">{n.author?.name ?? "Usuario"}</p>
                          <p className="text-slate-600 mt-1 whitespace-pre-wrap">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Bloque inferior: Cierre oficial */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2">
                  <span>🎯</span>
                  <span>Cierre Oficial del Ticket</span>
                </h4>
                {open ? (
                  <form action={resolveAction} className="flex flex-col gap-2">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <textarea
                      name="resolutionNotes"
                      rows={3}
                      maxLength={4000}
                      placeholder="Solución técnica aplicada para cerrar el ticket..."
                      className={inputClass}
                      required
                    />
                    <button
                      type="submit"
                      disabled={resolvePending}
                      className="w-fit rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {resolvePending ? "Cerrando..." : "✓ Marcar como cumplido y cerrar ticket"}
                    </button>
                    <Feedback state={resolveState} />
                  </form>
                ) : (
                  <p className="text-xs font-semibold text-emerald-800">
                    ✓ Este ticket ya se encuentra cerrado oficialmente.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
