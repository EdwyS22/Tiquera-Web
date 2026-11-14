import { env } from "@/lib/env";

export type FormspreeResult = {
  ok: boolean;
  status?: number;
  error?: string;
};

export async function postToFormspree(data: FormData): Promise<FormspreeResult> {
  try {
    const response = await fetch(env.formspreeEndpoint, {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "[formspree] El envio fue rechazado con estado",
        response.status,
      );
      return {
        ok: false,
        status: response.status,
        error: `Formspree respondio con estado ${response.status}.`,
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[formspree] Error de red al enviar.", error);
    return { ok: false, error: message };
  }
}

export async function sendTicketToFormspree(
  input: {
    code: string;
    title: string;
    landingUrl: string;
    reporterEmail: string;
    area?: string;
    product?: string;
    category: string;
    priority: string;
    description: string;
    attachmentNames: string[];
  },
): Promise<FormspreeResult> {
  const data = new FormData();
  data.append("_subject", `[${input.code}] Nuevo ticket - ${input.title}`);
  data.append("ticketCode", input.code);
  data.append("title", input.title);
  data.append("landingUrl", input.landingUrl);
  data.append("email", input.reporterEmail);
  data.append("reporterEmail", input.reporterEmail);
  if (input.area) {
    data.append("area", input.area);
  }
  if (input.product) {
    data.append("product", input.product);
  }
  data.append("category", input.category);
  data.append("priority", input.priority);
  data.append("message", input.description);
  data.append("description", input.description);
  data.append("attachmentNames", input.attachmentNames.join(", "));

  return postToFormspree(data);
}

export async function sendStaffNoticeToFormspree(input: {
  subject: string;
  body: string;
  recipients?: string[];
  type?: string;
}): Promise<FormspreeResult> {
  const data = new FormData();
  data.append("_subject", input.subject);
  data.append("subject", input.subject);
  data.append(
    "email",
    env.gmailUser || env.staffNotificationEmail || "equipo@tiquera.com",
  );
  data.append("message", input.body);
  data.append("type", input.type ?? "staff_notification");
  data.append("recipients", (input.recipients ?? []).join(", "));

  return postToFormspree(data);
}
