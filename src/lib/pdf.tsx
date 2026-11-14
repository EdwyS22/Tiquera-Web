import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type {
  TicketArea,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/generated/prisma/enums";
import {
  AREA_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SLA_HOURS,
} from "@/lib/tickets";

export type TicketPdfData = {
  code: string;
  title: string;
  landingUrl: string;
  reporterEmail: string;
  description: string;
  area?: TicketArea;
  product?: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  resolutionNotes: string | null;
  createdAt: Date;
  dueAt: Date;
  closedAt: Date | null;
  assignedToName: string | null;
};

const THEME = {
  primary: "#1e3a8a", // Azul corporativo oscuro
  primaryDark: "#0f172a", // Slate 900
  accent: "#2563eb", // Azul vibrante
  accentLight: "#dbeafe",
  ink: "#0f172a",
  textMuted: "#475569",
  textSoft: "#94a3b8",
  border: "#cbd5e1",
  borderLight: "#e2e8f0",
  bgSubtle: "#f8fafc",
  white: "#ffffff",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
};

const STATUS_CONFIG: Record<
  TicketStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  pending: {
    bg: "#fef3c7",
    text: "#b45309",
    border: "#fcd34d",
    label: "PENDIENTE",
  },
  in_progress: {
    bg: "#e0f2fe",
    text: "#0369a1",
    border: "#7dd3fc",
    label: "EN ATENCIÓN",
  },
  in_review: {
    bg: "#ede9fe",
    text: "#6d28d9",
    border: "#c4b5fd",
    label: "EN REVISIÓN",
  },
  completed: {
    bg: "#d1fae5",
    text: "#047857",
    border: "#6ee7b7",
    label: "RESUELTO / CUMPLIDO",
  },
  expired: {
    bg: "#f1f5f9",
    text: "#475569",
    border: "#cbd5e1",
    label: "VENCIDO POR SLA",
  },
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: THEME.ink,
    lineHeight: 1.45,
    backgroundColor: THEME.white,
  },

  // Header / Membrete Corporativo
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: THEME.primaryDark,
    marginBottom: 16,
  },
  logoBox: {
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: THEME.primaryDark,
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 8.5,
    color: THEME.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerMetaBox: {
    alignItems: "flex-end",
  },
  docTypeTag: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: THEME.accent,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  docDate: {
    fontSize: 8.5,
    color: THEME.textMuted,
  },

  // Banner del Ticket
  heroBanner: {
    backgroundColor: THEME.bgSubtle,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: THEME.accent,
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLeft: {
    flex: 1,
    paddingRight: 16,
  },
  heroCode: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: THEME.primaryDark,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: THEME.textMuted,
    marginTop: 3,
  },
  badge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },

  // Grid de Métricas / KPIs
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: THEME.bgSubtle,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  kpiLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: THEME.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: THEME.primaryDark,
  },

  // Ficha de Información Técnica (Tabla estructurada)
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.accent,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: THEME.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  tableContainer: {
    borderWidth: 1,
    borderColor: THEME.borderLight,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableCellKey: {
    width: "30%",
    backgroundColor: THEME.bgSubtle,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: THEME.borderLight,
  },
  tableCellKeyText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: THEME.textMuted,
  },
  tableCellValue: {
    width: "70%",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: THEME.white,
  },
  tableCellValueText: {
    fontSize: 8.5,
    color: THEME.ink,
  },

  // Bloques de Texto (Descripción y Solución)
  contentBox: {
    borderWidth: 1,
    borderColor: THEME.borderLight,
    borderRadius: 6,
    padding: 12,
    backgroundColor: THEME.bgSubtle,
    marginBottom: 14,
  },
  contentBodyText: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.5,
  },

  resolutionBox: {
    borderWidth: 1,
    borderColor: THEME.successBorder,
    borderLeftWidth: 4,
    borderLeftColor: THEME.success,
    borderRadius: 6,
    padding: 12,
    backgroundColor: THEME.successBg,
    marginBottom: 16,
  },
  resolutionTitleText: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: THEME.success,
    marginBottom: 4,
  },
  resolutionBodyText: {
    fontSize: 9,
    color: "#064e3b",
    lineHeight: 1.5,
  },

  // Sello de Auditoría / Certificación
  certBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    borderRadius: 6,
    backgroundColor: THEME.bgSubtle,
    marginTop: 6,
    marginBottom: 16,
  },
  certLeft: {
    flex: 1,
    paddingRight: 12,
  },
  certTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: THEME.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  certDesc: {
    fontSize: 7.5,
    color: THEME.textMuted,
    marginTop: 2,
  },
  certStamp: {
    borderWidth: 1.5,
    borderColor: THEME.success,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  certStampText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: THEME.success,
    letterSpacing: 1,
  },

  // Footer fijo
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    color: THEME.textSoft,
  },
});

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function calculateElapsed(createdAt: Date, closedAt: Date | null): string {
  if (!closedAt) {
    return "En curso";
  }

  const ms = closedAt.getTime() - createdAt.getTime();
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${minutes}m`;
}

function isWithinSla(createdAt: Date, closedAt: Date | null, dueAt: Date): boolean {
  if (!closedAt) return true;
  return closedAt.getTime() <= dueAt.getTime();
}

function TicketDocument({ data }: { data: TicketPdfData }) {
  const statusCfg = STATUS_CONFIG[data.status];
  const withinSla = isWithinSla(data.createdAt, data.closedAt, data.dueAt);
  const slaText = withinSla ? "Dentro de plazo" : "SLA Superado";

  return (
    <Document
      title={`Reporte-${data.code}`}
      author="Tiquera Web Enterprise"
      subject={`Informe Tecnico de Atencion - ${data.title}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Membrete Oficial */}
        <View style={styles.headerContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.brandTitle}>TIQUERA WEB</Text>
            <Text style={styles.brandSubtitle}>
              Sistema Integral de Gestión de Incidencias & Soporte
            </Text>
          </View>
          <View style={styles.headerMetaBox}>
            <Text style={styles.docTypeTag}>Informe Oficial de Cierre</Text>
            <Text style={styles.docDate}>
              Emisión: {formatDate(new Date())}
            </Text>
          </View>
        </View>

        {/* Hero Banner del Ticket */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroCode}>TICKET #{data.code}</Text>
            <Text style={styles.heroTitle}>{data.title}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* KPIs / Métricas Rápidas */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Categoría</Text>
            <Text style={styles.kpiValue}>
              {CATEGORY_LABELS[data.category]}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Prioridad</Text>
            <Text style={styles.kpiValue}>
              {PRIORITY_LABELS[data.priority]}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tiempo de Atención</Text>
            <Text style={styles.kpiValue}>
              {calculateElapsed(data.createdAt, data.closedAt)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Cumplimiento SLA</Text>
            <Text
              style={[
                styles.kpiValue,
                { color: withinSla ? THEME.success : THEME.warning },
              ]}
            >
              {slaText}
            </Text>
          </View>
        </View>

        {/* Ficha de Trazabilidad Técnica */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Detalles de Trazabilidad</Text>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableRow}>
            <View style={styles.tableCellKey}>
              <Text style={styles.tableCellKeyText}>Área de la Empresa</Text>
            </View>
            <View style={styles.tableCellValue}>
              <Text style={styles.tableCellValueText}>
                {data.area ? AREA_LABELS[data.area] : "Tecnología"}
              </Text>
            </View>
          </View>
          {data.product ? (
            <View style={styles.tableRow}>
              <View style={styles.tableCellKey}>
                <Text style={styles.tableCellKeyText}>Producto / Servicio</Text>
              </View>
              <View style={styles.tableCellValue}>
                <Text style={styles.tableCellValueText}>{data.product}</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.tableRow}>
            <View style={styles.tableCellKey}>
              <Text style={styles.tableCellKeyText}>Reportante</Text>
            </View>
            <View style={styles.tableCellValue}>
              <Text style={styles.tableCellValueText}>
                {data.reporterEmail}
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCellKey}>
              <Text style={styles.tableCellKeyText}>Sitio / URL Afectada</Text>
            </View>
            <View style={styles.tableCellValue}>
              <Text style={styles.tableCellValueText}>
                {data.landingUrl || "No especificada"}
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCellKey}>
              <Text style={styles.tableCellKeyText}>Especialista Asignado</Text>
            </View>
            <View style={styles.tableCellValue}>
              <Text style={styles.tableCellValueText}>
                {data.assignedToName ?? "Mesa de Soporte Global"}
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCellKey}>
              <Text style={styles.tableCellKeyText}>Fecha de Apertura</Text>
            </View>
            <View style={styles.tableCellValue}>
              <Text style={styles.tableCellValueText}>
                {formatDate(data.createdAt)}
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCellKey}>
              <Text style={styles.tableCellKeyText}>
                Límite de SLA ({SLA_HOURS}h)
              </Text>
            </View>
            <View style={styles.tableCellValue}>
              <Text style={styles.tableCellValueText}>
                {formatDate(data.dueAt)}
              </Text>
            </View>
          </View>
          <View style={styles.tableRowLast}>
            <View style={styles.tableCellKey}>
              <Text style={styles.tableCellKeyText}>Fecha de Cierre</Text>
            </View>
            <View style={styles.tableCellValue}>
              <Text style={styles.tableCellValueText}>
                {data.closedAt ? formatDate(data.closedAt) : "Sin cerrar"}
              </Text>
            </View>
          </View>
        </View>

        {/* Descripción Original del Problema */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>Descripción del Incidente</Text>
        </View>
        <View style={styles.contentBox}>
          <Text style={styles.contentBodyText}>{data.description}</Text>
        </View>

        {/* Dictamen y Notas de Resolución */}
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionDot,
              {
                backgroundColor:
                  data.status === "completed" ? THEME.success : THEME.textMuted,
              },
            ]}
          />
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  data.status === "completed" ? THEME.success : THEME.primaryDark,
              },
            ]}
          >
            Dictamen Técnico & Notas de Resolución
          </Text>
        </View>
        <View style={styles.resolutionBox}>
          <Text style={styles.resolutionTitleText}>
            {data.status === "completed"
              ? "Acción de Resolución Implementada:"
              : "Motivo de Cierre:"}
          </Text>
          <Text style={styles.resolutionBodyText}>
            {data.resolutionNotes ??
              `Cierre automático del sistema tras superar el tiempo máximo establecido por la política de SLA (${SLA_HOURS} horas) sin resolución manual.`}
          </Text>
        </View>

        {/* Sello de Certificación Digital */}
        <View style={styles.certBox}>
          <View style={styles.certLeft}>
            <Text style={styles.certTitle}>Certificación de Auditoría</Text>
            <Text style={styles.certDesc}>
              Este informe certifica la trazabilidad y registro formal de la
              atención prestada según los estándares de servicio de Tiquera Web.
            </Text>
          </View>
          <View style={styles.certStamp}>
            <Text style={styles.certStampText}>VERIFICADO</Text>
          </View>
        </View>

        {/* Pie de página con numeración y copyright exclusivo */}
        <View style={styles.footer} fixed>
          <View style={{ flexDirection: "column" }}>
            <Text style={[styles.footerText, { fontFamily: "Helvetica-Bold", color: "#334155" }]}>
              © {new Date().getFullYear()} Tiquera Web. Todos los derechos reservados.
            </Text>
            <Text style={styles.footerText}>
              Documento Confidencial y Exclusivo • Control de SLA & Trazabilidad de Incidencias
            </Text>
          </View>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export function renderTicketPdf(data: TicketPdfData): Promise<Buffer> {
  return renderToBuffer(<TicketDocument data={data} />);
}
