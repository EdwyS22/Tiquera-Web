import { Queue } from "bullmq";
import IORedis from "ioredis";

import { env } from "@/lib/env";

export const SLA_QUEUE_NAME = "ticket-sla";

let connection: IORedis | null = null;
let queue: Queue | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      connectTimeout: 1500,
      lazyConnect: true,
    });

    connection.on("error", () => {
      // Sin Redis disponible la app sigue funcionando con el chequeo perezoso del SLA.
    });
  }

  return connection;
}

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(SLA_QUEUE_NAME, { connection: getConnection() });
  }

  return queue;
}

export async function scheduleSlaExpiration(
  ticketId: string,
  delayMs: number,
): Promise<boolean> {
  try {
    await getQueue().add(
      "expire",
      { ticketId },
      {
        delay: Math.max(delayMs, 0),
        jobId: ticketId,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    return true;
  } catch (error) {
    console.warn(
      "[queue] No se pudo programar la expiracion (Redis no disponible). Se usara el chequeo perezoso.",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
