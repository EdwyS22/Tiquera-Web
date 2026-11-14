export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  try {
    const { startSlaWorker } = await import("@/lib/worker");
    await startSlaWorker();
  } catch (error) {
    console.error("[instrumentation] No se pudo iniciar el worker de SLA.", error);
  }
}
