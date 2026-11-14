import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logActivity, notifyStaffTeam } from "@/lib/notifications";
import { SLA_QUEUE_NAME } from "@/lib/queue";
import { finalizeClosedTicket } from "@/lib/ticket-service";
import { OPEN_STATUSES } from "@/lib/tickets";

let worker: Worker | null = null;

async function processExpiration(job: Job<{ ticketId: string }>) {
  const { ticketId } = job.data;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!ticket || !OPEN_STATUSES.includes(ticket.status)) {
    return;
  }

  const updated = await prisma.ticket.updateMany({
    where: { id: ticketId, status: { in: OPEN_STATUSES } },
    data: { status: "expired", closedAt: new Date() },
  });

  if (updated.count > 0) {
    await logActivity({
      ticketId: ticket.id,
      actorId: null,
      action: "closed",
      field: "status",
      oldValue: ticket.status,
      newValue: "expired",
    });

    await finalizeClosedTicket(ticketId);

    await notifyStaffTeam({
      type: "ticket_closed",
      title: `Ticket ${ticket.code} expirado por SLA`,
      body: `El ticket "${ticket.title}" supero las 24 horas de SLA y fue cerrado automaticamente.`,
      ticketId: ticket.id,
    });
  }
}

export async function startSlaWorker(): Promise<void> {
  if (worker || process.env.DISABLE_SLA_WORKER === "true") {
    return;
  }

  const connection = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 2000,
    retryStrategy: () => null,
  });

  try {
    await connection.connect();
    await connection.ping();
  } catch {
    console.warn(
      "[worker] Redis no disponible. La expiracion del SLA usara el chequeo perezoso.",
    );
    connection.disconnect();
    return;
  }

  worker = new Worker<{ ticketId: string }>(SLA_QUEUE_NAME, processExpiration, {
    connection,
  });

  worker.on("failed", (job, error) => {
    console.error(`[worker] Ticket ${job?.data.ticketId}:`, error.message);
  });

  console.log("[worker] Worker de SLA (24h) iniciado y conectado a Redis.");
}
