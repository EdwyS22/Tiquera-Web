"use server";

import type {
  TicketArea,
  TicketCategory,
  TicketPriority,
} from "@/generated/prisma/enums";
import { getCurrentStaff } from "@/lib/dal";
import { sendTicketToFormspree } from "@/lib/formspree";
import { validateAttachment } from "@/lib/storage";
import { classifyTicket } from "@/lib/ticket-classifier";
import { createTicket } from "@/lib/ticket-service";
import { createTicketSchema, type FormState } from "@/lib/validation";

export async function submitTicket(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    landingUrl: formData.get("landingUrl"),
    reporterEmail: formData.get("reporterEmail"),
    area: formData.get("area") || undefined,
    product: formData.get("product") || undefined,
    category: formData.get("category") || undefined,
    priority: (formData.get("priority") as string | null) || undefined,
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Clasificación inteligente automática basada en lo que indica el reporte
  const classification = classifyTicket(
    parsed.data.title,
    parsed.data.description,
  );

  const finalArea: TicketArea =
    !parsed.data.area || parsed.data.area === "auto"
      ? classification.area
      : (parsed.data.area as TicketArea);

  const finalCategory: TicketCategory =
    !parsed.data.category || parsed.data.category === "auto"
      ? classification.category
      : (parsed.data.category as TicketCategory);

  const finalPriority: TicketPriority =
    !parsed.data.priority || parsed.data.priority === "auto"
      ? classification.priority
      : (parsed.data.priority as TicketPriority);

  const finalProduct =
    !parsed.data.product || parsed.data.product === "auto"
      ? (classification.product ?? null)
      : parsed.data.product;

  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File)
    .filter((file) => file.size > 0 && file.name.length > 0);

  for (const file of files) {
    const error = validateAttachment(file);

    if (error) {
      return { message: error };
    }
  }

  const staff = formData.get("createdBySelf") ? await getCurrentStaff() : null;

  try {
    const ticket = await createTicket({
      title: parsed.data.title,
      landingUrl: parsed.data.landingUrl,
      reporterEmail: parsed.data.reporterEmail,
      area: finalArea,
      product: finalProduct,
      category: finalCategory,
      priority: finalPriority,
      description: parsed.data.description,
      files,
      createdById: staff?.id ?? null,
    });

    await sendTicketToFormspree({
      code: ticket.code,
      title: parsed.data.title,
      landingUrl: parsed.data.landingUrl,
      reporterEmail: parsed.data.reporterEmail,
      area: finalArea,
      product: finalProduct ?? undefined,
      category: finalCategory,
      priority: finalPriority,
      description: parsed.data.description,
      attachmentNames: files.map((file) => file.name),
    });

    return { ok: true, data: { code: ticket.code } };
  } catch (error) {
    console.error("[ticket] Error al crear el ticket.", error);
    return {
      message:
        "No fue posible crear el ticket. Revisa tu conexion e intentalo de nuevo.",
    };
  }
}