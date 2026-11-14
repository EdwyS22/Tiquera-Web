import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import { slaDeadline } from "../src/lib/tickets";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@tiquera.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345";
const AGENT_EMAIL = process.env.SEED_AGENT_EMAIL ?? "agente@tiquera.local";
const AGENT_PASSWORD = process.env.SEED_AGENT_PASSWORD ?? "Agente12345";

const SAMPLE_TICKETS = [
  {
    title: "El formulario de contacto no envia el correo",
    landingUrl: "https://ejemplo.com/contacto",
    reporterEmail: "maria@cliente.com",
    description:
      "Al enviar el formulario aparece un mensaje de exito pero ningun correo llega a la bandeja de entrada.",
    category: "funcionalidad" as const,
    priority: "high" as const,
    status: "pending" as const,
  },
  {
    title: "El hero se desalinea en movil",
    landingUrl: "https://ejemplo.com/nosotros",
    reporterEmail: "jose@cliente.com",
    description:
      "En anchos de 375px el titulo principal se corta y el boton queda fuera de la pantalla.",
    category: "diseno" as const,
    priority: "medium" as const,
    status: "in_progress" as const,
  },
  {
    title: "Textos desactualizados en la seccion de precios",
    landingUrl: "https://ejemplo.com/precios",
    reporterEmail: "ana@cliente.com",
    description:
      "La tabla menciona un precio que ya no aplica y el enlace de plan lleva a una pagina inexistente.",
    category: "contenido" as const,
    priority: "low" as const,
    status: "completed" as const,
  },
  {
    title: "La pagina tarda mas de 5 segundos en cargar",
    landingUrl: "https://ejemplo.com/blog",
    reporterEmail: "luis@cliente.com",
    description:
      "El LCP en movil supera los 5 segundos por imagenes sin optimizar en la portada del blog.",
    category: "performance" as const,
    priority: "high" as const,
    status: "expired" as const,
  },
];

async function main() {
  const admin = await prisma.staffUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "Administrador",
      email: ADMIN_EMAIL,
      passwordHash: await hash(ADMIN_PASSWORD, 12),
      role: "superadmin",
    },
  });

  const agent = await prisma.staffUser.upsert({
    where: { email: AGENT_EMAIL },
    update: {},
    create: {
      name: "Agente de Soporte",
      email: AGENT_EMAIL,
      passwordHash: await hash(AGENT_PASSWORD, 12),
      role: "agent",
    },
  });

  const existing = await prisma.ticket.count();

  if (existing === 0) {
    const now = Date.now();

    for (const [index, sample] of SAMPLE_TICKETS.entries()) {
      const createdAt = new Date(now - (index + 1) * 6 * 60 * 60 * 1000);
      const isClosed = sample.status === "completed" || sample.status === "expired";

      await prisma.ticket.create({
        data: {
          code: `TK-${String(10001 + index)}`,
          title: sample.title,
          landingUrl: sample.landingUrl,
          reporterEmail: sample.reporterEmail,
          description: sample.description,
          category: sample.category,
          priority: sample.priority,
          status: sample.status,
          assignedToId: sample.status === "pending" ? null : agent.id,
          createdById: admin.id,
          createdAt,
          dueAt: slaDeadline(createdAt),
          closedAt: isClosed ? new Date(createdAt.getTime() + 12 * 60 * 60 * 1000) : null,
          resolutionNotes: isClosed
            ? "Se aplico la correccion y se verifico el despliegue."
            : null,
          resolutionAt:
            sample.status === "completed"
              ? new Date(createdAt.getTime() + 12 * 60 * 60 * 1000)
              : null,
        },
      });
    }

    console.log("Tickets de ejemplo creados.");
  } else {
    console.log(`Ya existen ${existing} tickets, se omiten los de ejemplo.`);
  }

  console.log(`Admin:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`Agente: ${AGENT_EMAIL} / ${AGENT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
