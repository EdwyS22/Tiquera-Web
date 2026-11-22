"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useState } from "react";

import { submitTicket } from "@/app/actions/tickets";
import { classifyTicket } from "@/lib/ticket-classifier";
import {
  AREAS,
  AREA_CONFIG,
  AREA_ICONS,
  AREA_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  type TicketArea,
  type TicketCategory,
  type TicketPriority,
} from "@/lib/tickets";
import type { FormState } from "@/lib/validation";

function ErrorList({ errors }: { errors?: string[] }) {
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

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/30";

export function ReportForm({ staffMode = false }: { staffMode?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitTicket,
    undefined,
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Estado de los campos clasificadores
  const [selectedArea, setSelectedArea] = useState<TicketArea>("tecnologia");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<TicketCategory>("funcionalidad");
  const [selectedPriority, setSelectedPriority] =
    useState<TicketPriority>("medium");

  // Control de personalización manual vs automático
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [showManualSettings, setShowManualSettings] = useState<boolean>(false);

  const manualSettingsId = useId();

  // Clasificación en tiempo real basada en lo que escribe el usuario
  const autoClass = useMemo(() => {
    return classifyTicket(title, description);
  }, [title, description]);

  // Si no hay intervención manual, mantener siempre los valores automáticos
  const activeArea = isManualOverride ? selectedArea : autoClass.area;
  const activeProduct = isManualOverride
    ? selectedProduct
    : (autoClass.product ?? "");
  const activeCategory = isManualOverride ? selectedCategory : autoClass.category;
  const activePriority = isManualOverride ? selectedPriority : autoClass.priority;

  const currentAreaInfo = AREA_CONFIG[activeArea];
  const products = currentAreaInfo.products;
  const currentProductInfo = products.find((p) => p.name === activeProduct);

  const handleResetToAuto = () => {
    setIsManualOverride(false);
    setSelectedArea(autoClass.area);
    setSelectedProduct(autoClass.product ?? "");
    setSelectedCategory(autoClass.category);
    setSelectedPriority(autoClass.priority);
  };

  if (state?.ok && state.data?.code) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/60">
        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
          {state.data.code as string}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {staffMode ? "Ticket creado" : "Tu reporte fue recibido"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
          {staffMode
            ? "El ticket queda registrado con tu nombre como creador y ya puede gestionarse desde el panel."
            : "Guarda el código para dar seguimiento. Recibirás el informe PDF en tu correo cuando el ticket se cierre."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {staffMode ? (
            <>
              <Link
                href="/panel"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-700"
              >
                Volver al panel
              </Link>
              <Link
                href="/panel/nuevo"
                className="rounded-lg border border-emerald-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Crear otro ticket
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/ticket/${state.data.code}`}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-700"
              >
                Ver estado del ticket
              </Link>
              <Link
                href="/panel/nuevo"
                className="rounded-lg border border-emerald-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reportar otro problema
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {staffMode ? <input type="hidden" name="createdBySelf" value="1" /> : null}
      {state?.message ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
          {state.message}
        </p>
      ) : null}

      {/* Título del problema */}
      <div>
        <label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Título del problema
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={140}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. El formulario de contacto no envía el correo"
          className={inputClass}
        />
        <ErrorList errors={state?.errors?.title} />
      </div>

      {/* URL y Correo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="landingUrl" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            URL de la página afectada
          </label>
          <input
            id="landingUrl"
            name="landingUrl"
            type="url"
            required
            placeholder="https://tusitio.com/contacto"
            className={inputClass}
          />
          <ErrorList errors={state?.errors?.landingUrl} />
        </div>

        <div>
          <label htmlFor="reporterEmail" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Correo de contacto
          </label>
          <input
            id="reporterEmail"
            name="reporterEmail"
            type="email"
            required
            autoComplete="email"
            placeholder="donde@recibes.com"
            className={inputClass}
          />
          <ErrorList errors={state?.errors?.reporterEmail} />
        </div>
      </div>

      {/* Descripción detallada */}
      <div>
        <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Descripción detallada
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={15}
          maxLength={4000}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe qué ocurre, cuándo aparece y cómo reproducirlo... El sistema clasificará el ticket automáticamente."
          className={inputClass}
        />
        <ErrorList errors={state?.errors?.description} />
      </div>

      {/* Tarjeta de clasificación inteligente automática */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 p-4 transition-all dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-xs">
              ⚡
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Clasificación automática del ticket
                </h3>
                {isManualOverride ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    ✏️ Personalizado
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    ✓ En automático
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isManualOverride
                  ? "Has modificado manualmente los parámetros del ticket."
                  : "Se detecta automáticamente según lo que escribes. No tienes que especificarlo."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManualOverride ? (
              <button
                type="button"
                onClick={handleResetToAuto}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
              >
                ↺ Volver a automático
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowManualSettings(!showManualSettings)}
              aria-expanded={showManualSettings}
              aria-controls={manualSettingsId}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {showManualSettings ? "Ocultar ajustes" : "Personalizar clasificación"}
            </button>
          </div>
        </div>

        {/* Resumen de insignias detectadas */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 font-medium text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <span>{AREA_ICONS[activeArea]}</span>
            <span>Área: {AREA_LABELS[activeArea]}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            <span>⚙️</span>
            <span>Tipo: {CATEGORY_LABELS[activeCategory]}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium ${PRIORITY_STYLES[activePriority]}`}
          >
            <span>●</span>
            <span>Prioridad: {PRIORITY_LABELS[activePriority]}</span>
          </span>

          {activeProduct ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span>📦</span>
              <span>{activeProduct}</span>
            </span>
          ) : null}
        </div>

        {/* Sección desplegable para ajustes manuales si el usuario lo desea */}
        {showManualSettings ? (
          <div
            id={manualSettingsId}
            className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-800"
          >
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Puedes ajustar manualmente cualquiera de los valores si deseas sobreescribir la detección automática:
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="area" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Área de la empresa
                </label>
                <select
                  id="area"
                  name="area"
                  value={activeArea}
                  onChange={(e) => {
                    setIsManualOverride(true);
                    setSelectedArea(e.target.value as TicketArea);
                    setSelectedProduct("");
                  }}
                  className={inputClass}
                >
                  {AREAS.map((item) => (
                    <option key={item} value={item}>
                      {AREA_CONFIG[item].icon} {AREA_CONFIG[item].label}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {currentAreaInfo.role}
                </div>
              </div>

              <div>
                <label htmlFor="product" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Producto o Servicio
                </label>
                <select
                  id="product"
                  name="product"
                  value={activeProduct}
                  onChange={(e) => {
                    setIsManualOverride(true);
                    setSelectedProduct(e.target.value);
                  }}
                  className={inputClass}
                >
                  <option value="">(Consulta general / Otro servicio)</option>
                  {products.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {currentProductInfo ? (
                  <p className="mt-1 text-[11px] text-blue-800 dark:text-blue-300">
                    {currentProductInfo.description}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="priority" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Prioridad
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={activePriority}
                  onChange={(e) => {
                    setIsManualOverride(true);
                    setSelectedPriority(e.target.value as TicketPriority);
                  }}
                  className={inputClass}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Tipo de problema (categoría)
                </label>
                <select
                  id="category"
                  name="category"
                  value={activeCategory}
                  onChange={(e) => {
                    setIsManualOverride(true);
                    setSelectedCategory(e.target.value as TicketCategory);
                  }}
                  className={inputClass}
                >
                  <option value="funcionalidad">Funcionalidad</option>
                  <option value="diseno">Diseño</option>
                  <option value="contenido">Contenido</option>
                  <option value="performance">Rendimiento / Carga</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Inputs ocultos cuando el panel manual está cerrado para enviar los valores calculados automáticamente */
          <>
            <input type="hidden" name="area" value={activeArea} />
            <input type="hidden" name="product" value={activeProduct} />
            <input type="hidden" name="category" value={activeCategory} />
            <input type="hidden" name="priority" value={activePriority} />
          </>
        )}
      </div>

      {/* Evidencias */}
      <div>
        <label htmlFor="attachments" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Evidencias (opcional, hasta 5 archivos de 5MB)
        </label>
        <input
          id="attachments"
          name="attachments"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
          className="mt-1.5 w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Enviando reporte..." : "Crear ticket"}
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Al enviar aceptas recibir el informe de cierre por correo. No necesitas
        cuenta.
      </p>
    </form>
  );
}
