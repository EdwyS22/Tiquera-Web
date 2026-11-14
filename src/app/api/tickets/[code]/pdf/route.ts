import { prisma } from "@/lib/db";
import { renderTicketPdf } from "@/lib/pdf";
import { OPEN_STATUSES } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: { assignedTo: { select: { name: true } } },
  });

  if (!ticket) {
    return new Response("Ticket no encontrado.", { status: 404 });
  }

  if (OPEN_STATUSES.includes(ticket.status) || !ticket.closedAt) {
    return new Response(
      "El informe PDF estará disponible únicamente cuando el ticket sea cerrado.",
      { status: 409 },
    );
  }

  const pdf = await renderTicketPdf({
    code: ticket.code,
    title: ticket.title,
    landingUrl: ticket.landingUrl,
    reporterEmail: ticket.reporterEmail,
    description: ticket.description,
    area: ticket.area,
    product: ticket.product,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    resolutionNotes: ticket.resolutionNotes,
    createdAt: ticket.createdAt,
    dueAt: ticket.dueAt,
    closedAt: ticket.closedAt,
    assignedToName: ticket.assignedTo?.name ?? null,
  });

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ticket.code}.pdf"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
