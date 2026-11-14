import type {
  TicketArea,
  TicketCategory,
  TicketPriority,
} from "@/generated/prisma/enums";
import {
  AREA_CONFIG,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  findAreaForProduct,
} from "@/lib/tickets";

export interface TicketClassification {
  area: TicketArea;
  category: TicketCategory;
  priority: TicketPriority;
  product?: string;
  confidence: {
    area: number;
    category: number;
    priority: number;
  };
  detectedTerms: {
    area: string[];
    category: string[];
    priority: string[];
    product?: string;
  };
  summary: string;
}

/**
 * Normaliza texto eliminando acentos y puntuación para facilitar el análisis por palabras clave.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Verifica si un término aparece como palabra completa o frase exacta en el texto normalizado.
 * Evita falsos positivos (por ejemplo: 'ia' dentro de 'enviar' o 'iva' dentro de 'privacidad').
 */
function containsTerm(normalizedPaddedText: string, term: string): boolean {
  const normTerm = normalizeText(term);
  if (!normTerm) return false;
  return normalizedPaddedText.includes(` ${normTerm} `);
}

type KeywordRule = {
  term: string;
  weight: number;
};

// Diccionario de reglas para ÁREA
const AREA_RULES: Record<TicketArea, KeywordRule[]> = {
  finanzas: [
    { term: "precio", weight: 3 },
    { term: "precios", weight: 3 },
    { term: "tarifa", weight: 3 },
    { term: "tarifas", weight: 3 },
    { term: "pricing", weight: 4 },
    { term: "costo", weight: 3 },
    { term: "costos", weight: 3 },
    { term: "cobro", weight: 4 },
    { term: "cobrar", weight: 4 },
    { term: "cobraron", weight: 4 },
    { term: "factura", weight: 4 },
    { term: "facturacion", weight: 4 },
    { term: "facturas", weight: 4 },
    { term: "boleta", weight: 4 },
    { term: "recibo", weight: 3 },
    { term: "pago", weight: 4 },
    { term: "pagos", weight: 4 },
    { term: "pagar", weight: 4 },
    { term: "pasarela", weight: 5 },
    { term: "stripe", weight: 5 },
    { term: "paypal", weight: 5 },
    { term: "tarjeta", weight: 3 },
    { term: "reembolso", weight: 4 },
    { term: "devolucion", weight: 4 },
    { term: "saldo", weight: 3 },
    { term: "dinero", weight: 3 },
    { term: "transferencia", weight: 3 },
    { term: "cuenta bancaria", weight: 4 },
    { term: "suscripcion", weight: 3 },
    { term: "suscripciones", weight: 3 },
    { term: "cotizacion", weight: 3 },
    { term: "modelo de precios", weight: 5 },
    { term: "diagnostico financiero", weight: 5 },
    { term: "balance", weight: 3 },
    { term: "contabilidad", weight: 4 },
    { term: "impuesto", weight: 3 },
    { term: "iva", weight: 4 },
    { term: "rentabilidad", weight: 4 },
    { term: "flujo de caja", weight: 4 },
  ],
  marketing: [
    { term: "campana", weight: 4 },
    { term: "campanas", weight: 4 },
    { term: "ads", weight: 4 },
    { term: "anuncio", weight: 4 },
    { term: "anuncios", weight: 4 },
    { term: "pauta", weight: 4 },
    { term: "publicidad", weight: 4 },
    { term: "facebook ads", weight: 5 },
    { term: "google ads", weight: 5 },
    { term: "meta ads", weight: 5 },
    { term: "redes sociales", weight: 4 },
    { term: "instagram", weight: 4 },
    { term: "tiktok", weight: 4 },
    { term: "linkedin", weight: 3 },
    { term: "branding", weight: 5 },
    { term: "marca", weight: 3 },
    { term: "manual de marca", weight: 5 },
    { term: "identidad corporativa", weight: 5 },
    { term: "identidad visual", weight: 5 },
    { term: "logotipo", weight: 4 },
    { term: "logo", weight: 3 },
    { term: "flyer", weight: 4 },
    { term: "carrusel", weight: 3 },
    { term: "motor de contenido", weight: 5 },
    { term: "newsletter", weight: 4 },
    { term: "mailing", weight: 4 },
    { term: "email marketing", weight: 4 },
    { term: "leads", weight: 4 },
    { term: "lead", weight: 3 },
    { term: "conversion", weight: 3 },
    { term: "conversiones", weight: 4 },
    { term: "pixel", weight: 4 },
    { term: "analytics", weight: 3 },
    { term: "trafico", weight: 3 },
    { term: "seo", weight: 4 },
    { term: "campanas digitales", weight: 5 },
  ],
  estrategia: [
    { term: "estrategia", weight: 5 },
    { term: "estrategico", weight: 4 },
    { term: "estrategica", weight: 4 },
    { term: "consultoria", weight: 4 },
    { term: "consultor", weight: 4 },
    { term: "diagnostico organizacional", weight: 5 },
    { term: "rediseno estrategico", weight: 5 },
    { term: "desarrollo directivo", weight: 5 },
    { term: "organigrama", weight: 4 },
    { term: "clima laboral", weight: 4 },
    { term: "cultura organizacional", weight: 4 },
    { term: "recursos humanos", weight: 4 },
    { term: "rendimiento colectivo", weight: 4 },
    { term: "mision", weight: 3 },
    { term: "vision", weight: 3 },
    { term: "okr", weight: 5 },
    { term: "kpi", weight: 4 },
    { term: "modelo de negocio", weight: 5 },
    { term: "planeacion", weight: 4 },
    { term: "planificacion", weight: 4 },
    { term: "liderazgo", weight: 4 },
    { term: "directivo", weight: 4 },
    { term: "directivos", weight: 4 },
    { term: "gerencia", weight: 4 },
    { term: "capacitacion ejecutiva", weight: 5 },
    { term: "formacion directiva", weight: 5 },
    { term: "coaching", weight: 4 },
    { term: "reestructuracion", weight: 4 },
  ],
  tecnologia: [
    { term: "web", weight: 2 },
    { term: "sitio", weight: 2 },
    { term: "landing", weight: 3 },
    { term: "pagina", weight: 2 },
    { term: "portal", weight: 2 },
    { term: "plataforma", weight: 2 },
    { term: "app", weight: 3 },
    { term: "aplicacion", weight: 3 },
    { term: "formulario", weight: 3 },
    { term: "boton", weight: 2 },
    { term: "enlace", weight: 2 },
    { term: "link", weight: 2 },
    { term: "input", weight: 3 },
    { term: "servidor", weight: 4 },
    { term: "server", weight: 4 },
    { term: "hosting", weight: 4 },
    { term: "dominio", weight: 3 },
    { term: "dns", weight: 4 },
    { term: "ssl", weight: 4 },
    { term: "base de datos", weight: 4 },
    { term: "database", weight: 4 },
    { term: "sql", weight: 4 },
    { term: "api", weight: 4 },
    { term: "endpoint", weight: 4 },
    { term: "webhook", weight: 4 },
    { term: "codigo", weight: 3 },
    { term: "script", weight: 3 },
    { term: "frontend", weight: 4 },
    { term: "backend", weight: 4 },
    { term: "deploy", weight: 4 },
    { term: "login", weight: 3 },
    { term: "sesion", weight: 3 },
    { term: "contrasena", weight: 3 },
    { term: "password", weight: 3 },
    { term: "autenticacion", weight: 4 },
    { term: "delivery", weight: 5 },
    { term: "pedidos", weight: 4 },
    { term: "repartos", weight: 4 },
    { term: "repartidor", weight: 4 },
    { term: "motorizado", weight: 4 },
    { term: "comandas", weight: 4 },
    { term: "ia", weight: 5 },
    { term: "chatbot", weight: 5 },
    { term: "bot", weight: 4 },
    { term: "inteligencia artificial", weight: 5 },
    { term: "asistente virtual", weight: 5 },
    { term: "error", weight: 2 },
    { term: "bug", weight: 3 },
    { term: "crash", weight: 4 },
    { term: "500", weight: 3 },
    { term: "404", weight: 3 },
    { term: "pantalla blanca", weight: 4 },
    { term: "responsive", weight: 3 },
    { term: "css", weight: 3 },
    { term: "html", weight: 3 },
    { term: "javascript", weight: 4 },
  ],
};

// Diccionario de reglas para CATEGORÍA
const CATEGORY_RULES: Record<TicketCategory, KeywordRule[]> = {
  diseno: [
    { term: "diseno", weight: 5 },
    { term: "css", weight: 4 },
    { term: "estilo", weight: 4 },
    { term: "estilos", weight: 4 },
    { term: "visual", weight: 4 },
    { term: "apariencia", weight: 3 },
    { term: "estetica", weight: 3 },
    { term: "desalineado", weight: 5 },
    { term: "desalineada", weight: 5 },
    { term: "descuadrado", weight: 5 },
    { term: "descuadrada", weight: 5 },
    { term: "superpuesto", weight: 4 },
    { term: "solapado", weight: 4 },
    { term: "se corta", weight: 5 },
    { term: "cortado", weight: 4 },
    { term: "fuera de la pantalla", weight: 5 },
    { term: "responsive", weight: 5 },
    { term: "movil", weight: 4 },
    { term: "celular", weight: 3 },
    { term: "tablet", weight: 3 },
    { term: "color", weight: 3 },
    { term: "colores", weight: 3 },
    { term: "fuente", weight: 3 },
    { term: "tipografia", weight: 4 },
    { term: "tamano", weight: 3 },
    { term: "espaciado", weight: 3 },
    { term: "margen", weight: 3 },
    { term: "padding", weight: 4 },
    { term: "hero", weight: 3 },
    { term: "interfaz", weight: 3 },
    { term: "ui", weight: 3 },
    { term: "pixelado", weight: 4 },
    { term: "se ve mal", weight: 5 },
    { term: "modo oscuro", weight: 4 },
    { term: "modo claro", weight: 4 },
  ],
  performance: [
    { term: "lento", weight: 5 },
    { term: "lenta", weight: 5 },
    { term: "lentitud", weight: 5 },
    { term: "tarda", weight: 4 },
    { term: "demora", weight: 4 },
    { term: "demorado", weight: 4 },
    { term: "velocidad", weight: 4 },
    { term: "rendimiento", weight: 5 },
    { term: "performance", weight: 5 },
    { term: "tiempo de carga", weight: 5 },
    { term: "carga lenta", weight: 5 },
    { term: "pesado", weight: 3 },
    { term: "pesada", weight: 3 },
    { term: "lcp", weight: 5 },
    { term: "fcp", weight: 5 },
    { term: "core web vitals", weight: 5 },
    { term: "lag", weight: 4 },
    { term: "se congela", weight: 4 },
    { term: "spinner", weight: 4 },
    { term: "optimizar imagenes", weight: 4 },
    { term: "cache", weight: 4 },
    { term: "timeout", weight: 5 },
    { term: "tiempo de espera agotado", weight: 5 },
    { term: "tarda mucho", weight: 5 },
    { term: "5 segundos", weight: 4 },
  ],
  contenido: [
    { term: "texto", weight: 3 },
    { term: "textos", weight: 3 },
    { term: "redaccion", weight: 4 },
    { term: "ortografia", weight: 5 },
    { term: "typo", weight: 4 },
    { term: "letra", weight: 3 },
    { term: "parrafo", weight: 3 },
    { term: "informacion", weight: 3 },
    { term: "desactualizado", weight: 5 },
    { term: "desactualizada", weight: 5 },
    { term: "dato equivocado", weight: 4 },
    { term: "dato incorrecto", weight: 4 },
    { term: "precio viejo", weight: 5 },
    { term: "enlace roto", weight: 5 },
    { term: "link roto", weight: 5 },
    { term: "404", weight: 4 },
    { term: "pagina inexistente", weight: 4 },
    { term: "no encontrada", weight: 4 },
    { term: "copy", weight: 4 },
    { term: "traduccion", weight: 4 },
    { term: "cambiar texto", weight: 5 },
  ],
  funcionalidad: [
    { term: "error", weight: 3 },
    { term: "fallo", weight: 4 },
    { term: "falla", weight: 4 },
    { term: "no funciona", weight: 5 },
    { term: "no sirve", weight: 4 },
    { term: "no envia", weight: 5 },
    { term: "no responde", weight: 4 },
    { term: "no hace nada", weight: 4 },
    { term: "no abre", weight: 4 },
    { term: "no guarda", weight: 4 },
    { term: "no deja", weight: 4 },
    { term: "no registra", weight: 4 },
    { term: "no procesa", weight: 4 },
    { term: "no llega", weight: 4 },
    { term: "bug", weight: 4 },
    { term: "crash", weight: 4 },
    { term: "excepcion", weight: 4 },
    { term: "pantalla blanca", weight: 4 },
    { term: "500", weight: 4 },
    { term: "502", weight: 4 },
    { term: "403", weight: 4 },
    { term: "formulario no envia", weight: 5 },
    { term: "no se puede", weight: 3 },
    { term: "se rompe", weight: 4 },
  ],
};

// Diccionario de reglas para PRIORIDAD
const PRIORITY_RULES: Record<TicketPriority, KeywordRule[]> = {
  high: [
    { term: "urgente", weight: 6 },
    { term: "urgencia", weight: 6 },
    { term: "critico", weight: 6 },
    { term: "critica", weight: 6 },
    { term: "grave", weight: 5 },
    { term: "emergencia", weight: 6 },
    { term: "fatal", weight: 5 },
    { term: "bloqueante", weight: 6 },
    { term: "caido", weight: 6 },
    { term: "se cayo", weight: 6 },
    { term: "no funciona nada", weight: 6 },
    { term: "pantalla blanca", weight: 5 },
    { term: "nadie puede", weight: 6 },
    { term: "todos los usuarios", weight: 5 },
    { term: "no se puede comprar", weight: 6 },
    { term: "no deja pagar", weight: 6 },
    { term: "cobro duplicado", weight: 6 },
    { term: "perdida de dinero", weight: 6 },
    { term: "hack", weight: 6 },
    { term: "hackeado", weight: 6 },
    { term: "seguridad", weight: 5 },
    { term: "vulnerabilidad", weight: 6 },
    { term: "inmediato", weight: 5 },
    { term: "asap", weight: 5 },
    { term: "cuanto antes", weight: 5 },
    { term: "500", weight: 4 },
    { term: "caida total", weight: 6 },
  ],
  low: [
    { term: "menor", weight: 4 },
    { term: "baja", weight: 4 },
    { term: "cosmetico", weight: 5 },
    { term: "cosmetica", weight: 5 },
    { term: "sugerencia", weight: 5 },
    { term: "idea", weight: 4 },
    { term: "cuando puedan", weight: 5 },
    { term: "no es urgente", weight: 6 },
    { term: "sin apuro", weight: 5 },
    { term: "detalle minimo", weight: 5 },
    { term: "typo", weight: 4 },
    { term: "falta ortografica", weight: 4 },
    { term: "pregunta sencilla", weight: 4 },
    { term: "cuando tengan tiempo", weight: 5 },
  ],
  medium: [
    { term: "problema", weight: 2 },
    { term: "revisar", weight: 2 },
    { term: "intermitente", weight: 3 },
    { term: "a veces", weight: 3 },
  ],
};

// Diccionario de Productos y sus términos distintivos
const PRODUCT_DETECTION_RULES: Array<{
  product: string;
  area: TicketArea;
  terms: string[];
  weight: number;
}> = [
  // Tecnología
  {
    product: "Plataforma de Delivery",
    area: "tecnologia",
    terms: ["delivery", "pedidos", "repartos", "repartidor", "motorizado", "comandas", "despachos", "courier"],
    weight: 4,
  },
  {
    product: "Agente de Inteligencia Artificial",
    area: "tecnologia",
    terms: ["chatbot", "agente ia", "agente de ia", "asistente virtual", "bot de ia", "llm", "gpt", "inteligencia artificial"],
    weight: 5,
  },
  {
    product: "Ecosistema Web",
    area: "tecnologia",
    terms: ["ecosistema web", "sitio web", "landing", "portal", "pagina web", "formulario", "boton", "servidor", "responsive"],
    weight: 3,
  },
  // Marketing
  {
    product: "Identidad Corporativa",
    area: "marketing",
    terms: ["identidad corporativa", "manual de marca", "identidad visual", "branding", "logotipo", "logo", "papeleria"],
    weight: 4,
  },
  {
    product: "Motor de Contenido",
    area: "marketing",
    terms: ["motor de contenido", "redaccion", "articulos", "blog", "copy", "redes sociales", "instagram", "tiktok", "carrusel"],
    weight: 4,
  },
  {
    product: "Campañas Digitales",
    area: "marketing",
    terms: ["campanas digitales", "ads", "anuncios", "pauta", "facebook ads", "google ads", "meta ads", "pixel", "leads"],
    weight: 4,
  },
  // Finanzas
  {
    product: "Diagnóstico Financiero",
    area: "finanzas",
    terms: ["diagnostico financiero", "flujo de caja", "balance", "rentabilidad", "salud economica", "auditoria financiera"],
    weight: 5,
  },
  {
    product: "Modelo de Precios",
    area: "finanzas",
    terms: ["modelo de precios", "tabla de precios", "precios", "tarifas", "pricing", "costo unitario", "margen"],
    weight: 4,
  },
  // Estrategia
  {
    product: "Diagnóstico Organizacional Integral",
    area: "estrategia",
    terms: ["diagnostico organizacional", "clima laboral", "cultura organizacional", "organigrama", "rendimiento colectivo"],
    weight: 5,
  },
  {
    product: "Rediseño Estratégico",
    area: "estrategia",
    terms: ["rediseno estrategico", "planeacion estrategica", "modelo de negocio", "okr", "kpi", "roadmap estrategico"],
    weight: 5,
  },
  {
    product: "Programa de Desarrollo Directivo",
    area: "estrategia",
    terms: ["desarrollo directivo", "capacitacion ejecutiva", "liderazgo directivo", "formacion directiva", "coaching directivo"],
    weight: 5,
  },
];

function scoreRules<T extends string>(
  paddedTitle: string,
  paddedDesc: string,
  rulesRecord: Record<T, KeywordRule[]>,
  defaultKey: T,
): { best: T; score: number; matchedTerms: string[] } {
  const scores: Record<string, { total: number; terms: string[] }> = {};

  for (const key of Object.keys(rulesRecord)) {
    scores[key] = { total: 0, terms: [] };
    const rules = rulesRecord[key as T];

    for (const rule of rules) {
      let matchCount = 0;

      // Mayor peso si aparece en el título (x2.5)
      if (containsTerm(paddedTitle, rule.term)) {
        matchCount += 2.5;
        scores[key].terms.push(rule.term);
      }

      // Peso estándar en la descripción
      if (containsTerm(paddedDesc, rule.term)) {
        matchCount += 1;
        if (!scores[key].terms.includes(rule.term)) {
          scores[key].terms.push(rule.term);
        }
      }

      if (matchCount > 0) {
        scores[key].total += rule.weight * matchCount;
      }
    }
  }

  let bestKey = defaultKey;
  let maxScore = 0;

  for (const [key, val] of Object.entries(scores)) {
    if (val.total > maxScore) {
      maxScore = val.total;
      bestKey = key as T;
    }
  }

  return {
    best: bestKey,
    score: maxScore,
    matchedTerms: scores[bestKey]?.terms ?? [],
  };
}

/**
 * Clasifica automáticamente un ticket basándose en su título y descripción.
 * No requiere especificar manualmente área, categoría ni prioridad.
 */
export function classifyTicket(
  title: string,
  description: string,
): TicketClassification {
  const normTitle = normalizeText(title || "");
  const normDesc = normalizeText(description || "");
  const paddedTitle = ` ${normTitle} `;
  const paddedDesc = ` ${normDesc} `;
  const combined = `${normTitle} ${normDesc}`;

  // 1. Detección de Categoría
  const catResult = scoreRules(
    paddedTitle,
    paddedDesc,
    CATEGORY_RULES,
    "funcionalidad" as TicketCategory,
  );

  // 2. Detección de Prioridad
  const prioResult = scoreRules(
    paddedTitle,
    paddedDesc,
    PRIORITY_RULES,
    "medium" as TicketPriority,
  );

  // 3. Detección de Producto
  let detectedProduct: string | undefined = undefined;
  let detectedProductArea: TicketArea | undefined = undefined;
  let bestProductScore = 0;

  for (const rule of PRODUCT_DETECTION_RULES) {
    let score = 0;
    for (const term of rule.terms) {
      if (containsTerm(paddedTitle, term)) {
        score += rule.weight * 2.5;
      } else if (containsTerm(paddedDesc, term)) {
        score += rule.weight;
      }
    }

    if (score > bestProductScore && score >= 4) {
      bestProductScore = score;
      detectedProduct = rule.product;
      detectedProductArea = rule.area;
    }
  }

  // 4. Detección de Área
  const areaResult = scoreRules(
    paddedTitle,
    paddedDesc,
    AREA_RULES,
    "tecnologia" as TicketArea,
  );

  let finalArea = areaResult.best;

  // Si se detectó un producto con alta certeza, su área tiene prioridad
  if (detectedProductArea && bestProductScore >= 5) {
    finalArea = detectedProductArea;
  }

  // Validar consistencia estricta: el producto DEBE pertenecer al área final elegida
  if (detectedProduct) {
    const pArea = findAreaForProduct(detectedProduct);
    if (pArea && pArea !== finalArea) {
      detectedProduct = undefined;
    }
  }

  // Si no hay producto específico pero estamos en tecnología y es web, sugerir Ecosistema Web
  if (!detectedProduct && finalArea === "tecnologia" && combined.length > 5) {
    detectedProduct = "Ecosistema Web";
  }

  const finalCategory = catResult.best;
  const finalPriority = prioResult.best;

  const areaLabel = AREA_CONFIG[finalArea]?.label ?? finalArea;
  const categoryLabel = CATEGORY_LABELS[finalCategory] ?? finalCategory;
  const priorityLabel = PRIORITY_LABELS[finalPriority] ?? finalPriority;

  const summary = `Clasificado automáticamente como ${areaLabel} · ${categoryLabel} · Prioridad ${priorityLabel}${
    detectedProduct ? ` · (${detectedProduct})` : ""
  }`;

  return {
    area: finalArea,
    category: finalCategory,
    priority: finalPriority,
    product: detectedProduct,
    confidence: {
      area: Math.min(100, Math.round(areaResult.score * 8)),
      category: Math.min(100, Math.round(catResult.score * 8)),
      priority: Math.min(100, Math.round(prioResult.score * 8)),
    },
    detectedTerms: {
      area: areaResult.matchedTerms,
      category: catResult.matchedTerms,
      priority: prioResult.matchedTerms,
      product: detectedProduct,
    },
    summary,
  };
}
