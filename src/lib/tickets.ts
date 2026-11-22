import type {
  StaffRole,
  TicketArea,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/generated/prisma/enums";

export type {
  StaffRole,
  TicketArea,
  TicketCategory,
  TicketPriority,
  TicketStatus,
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  superadmin: "Admin",
  admin: "Admin",
  agent: "Usuario",
};

export const AREAS: TicketArea[] = [
  "estrategia",
  "tecnologia",
  "marketing",
  "finanzas",
];

export interface AreaProduct {
  name: string;
  description: string;
}

export interface AreaInfo {
  id: TicketArea;
  label: string;
  role: string;
  icon: string;
  style: string;
  products: AreaProduct[];
}

export const AREA_CONFIG: Record<TicketArea, AreaInfo> = {
  estrategia: {
    id: "estrategia",
    label: "Estrategia Empresarial",
    role: "Consultores estratégicos y analistas de negocio que traducen la visión en decisiones medibles.",
    icon: "🎯",
    style: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    products: [
      {
        name: "Diagnóstico Organizacional Integral",
        description:
          "Análisis profundo de la cultura, estructura y dinámica organizacional para identificar los factores que frenan o impulsan el rendimiento colectivo.",
      },
      {
        name: "Rediseño Estratégico",
        description:
          "Proceso colaborativo para revisar, actualizar o construir desde cero la estrategia de la organización con metodologías de planeación estratégica avanzada.",
      },
      {
        name: "Programa de Desarrollo Directivo",
        description:
          "Programa de formación ejecutiva diseñado a medida para desarrollar las competencias de liderazgo que el contexto actual demanda.",
      },
    ],
  },
  tecnologia: {
    id: "tecnologia",
    label: "Tecnología",
    role: "Ingenieros de software, desarrolladores full-stack, especialistas en IA y arquitectos de sistemas.",
    icon: "💻",
    style: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    products: [
      {
        name: "Plataforma de Delivery",
        description:
          "Ecosistema completo de pedidos y logística: app de cliente, panel de comercio y gestión de repartos.",
      },
      {
        name: "Ecosistema Web",
        description:
          "Sitios y aplicaciones web corporativas de alto rendimiento, optimizadas para conversión y escala.",
      },
      {
        name: "Agente de Inteligencia Artificial",
        description:
          "Asistentes y agentes de IA que automatizan atención, ventas y operaciones internas con data limpia.",
      },
    ],
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    role: "Mercadólogos, diseñadores y gestores de contenido que convierten la marca en demanda.",
    icon: "📈",
    style: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    products: [
      {
        name: "Identidad Corporativa",
        description:
          "Sistema de marca completo: estrategia, identidad visual y manual de aplicación para una presencia consistente.",
      },
      {
        name: "Motor de Contenido",
        description:
          "Producción sostenida de contenido estratégico para alimentar tus canales con consistencia.",
      },
      {
        name: "Campañas Digitales",
        description:
          "Campañas de performance diseñadas para generar demanda calificada y reputación de mercado.",
      },
    ],
  },
  finanzas: {
    id: "finanzas",
    label: "Finanzas",
    role: "Contadores, administradores y analistas financieros que blindan la viabilidad de cada operación.",
    icon: "💰",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    products: [
      {
        name: "Diagnóstico Financiero",
        description:
          "Análisis profundo de la salud económica de tu operación con hallazgos y recomendaciones accionables.",
      },
      {
        name: "Modelo de Precios",
        description:
          "Estructura de precios basada en costos, mercado y márgenes objetivo para maximizar rentabilidad.",
      },
    ],
  },
};

export const AREA_LABELS: Record<TicketArea, string> = {
  estrategia: AREA_CONFIG.estrategia.label,
  tecnologia: AREA_CONFIG.tecnologia.label,
  marketing: AREA_CONFIG.marketing.label,
  finanzas: AREA_CONFIG.finanzas.label,
};

export const AREA_ROLES: Record<TicketArea, string> = {
  estrategia: AREA_CONFIG.estrategia.role,
  tecnologia: AREA_CONFIG.tecnologia.role,
  marketing: AREA_CONFIG.marketing.role,
  finanzas: AREA_CONFIG.finanzas.role,
};

export const AREA_ICONS: Record<TicketArea, string> = {
  estrategia: AREA_CONFIG.estrategia.icon,
  tecnologia: AREA_CONFIG.tecnologia.icon,
  marketing: AREA_CONFIG.marketing.icon,
  finanzas: AREA_CONFIG.finanzas.icon,
};

export const AREA_STYLES: Record<TicketArea, string> = {
  estrategia: AREA_CONFIG.estrategia.style,
  tecnologia: AREA_CONFIG.tecnologia.style,
  marketing: AREA_CONFIG.marketing.style,
  finanzas: AREA_CONFIG.finanzas.style,
};

export function getProductsForArea(area: TicketArea): AreaProduct[] {
  return AREA_CONFIG[area]?.products ?? [];
}

export function findAreaForProduct(productName: string): TicketArea | undefined {
  for (const area of AREAS) {
    if (AREA_CONFIG[area].products.some((p) => p.name === productName)) {
      return area;
    }
  }
  return undefined;
}

export const SLA_HOURS = 24;

export const OPEN_STATUSES: TicketStatus[] = [
  "pending",
  "in_progress",
  "in_review",
];

export const MANAGEABLE_STATUSES: TicketStatus[] = [
  "pending",
  "in_progress",
  "in_review",
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  pending: "Pendiente",
  in_progress: "En Proceso",
  in_review: "En Revision",
  completed: "Cumplido",
  expired: "Expirado / Cerrado por SLA",
};

export const STATUS_STYLES: Record<TicketStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
  in_progress: "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300",
  in_review: "bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
  expired: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  diseno: "Diseno",
  funcionalidad: "Funcionalidad",
  contenido: "Contenido",
  performance: "Performance",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const PRIORITY_STYLES: Record<TicketPriority, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export const PRIORITY_ORDER: Record<TicketPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function slaDeadline(from: Date): Date {
  return new Date(from.getTime() + SLA_HOURS * 60 * 60 * 1000);
}

export function generateTicketCode(): string {
  const random = Math.floor(10000 + Math.random() * 89999);
  return `TK-${random}`;
}

export function isOpenStatus(status: TicketStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export const ACTIVITY_LABELS: Record<string, string> = {
  created: "Ticket creado",
  status_changed: "Cambio de estado",
  assigned: "Cambio de asignacion",
  updated: "Edicion del ticket",
  note_added: "Nota interna",
  message_sent: "Mensaje al cliente",
  closed: "Ticket cerrado",
  reopened: "Ticket reabierto",
};

export function formatRemaining(dueAt: Date, now: number = Date.now()): string {
  const remaining = dueAt.getTime() - now;

  if (remaining <= 0) {
    return "SLA vencido";
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  return `${hours}h ${minutes}m restantes`;
}
