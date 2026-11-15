import nodemailer from "nodemailer";
import { Resend } from "resend";

import { env, gmailEnabled, mailtrapEnabled, resendEnabled } from "@/lib/env";
import { sendStaffNoticeToFormspree } from "@/lib/formspree";
import type { SenderAuth } from "@/lib/mail-credentials";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function layout(title: string, body: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
      <h2 style="margin:0 0 8px;">${escapeHtml(title)}</h2>
      ${body}
    </div>
  `;
}

export type SendResult = {
  delivered: boolean;
  channel:
    | "user-gmail"
    | "global-gmail"
    | "resend"
    | "mailtrap"
    | "formspree"
    | "none";
  error?: string;
};

async function sendViaMailtrap(
  to: string[],
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: Buffer }>,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: env.mailtrap.host,
    port: env.mailtrap.port,
    auth: {
      user: env.mailtrap.user,
      pass: env.mailtrap.pass,
    },
  });

  await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
    attachments,
  });
}

async function sendViaGmail(
  sender: SenderAuth,
  to: string[],
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: Buffer }>,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: sender.user, pass: sender.pass },
  });

  await transporter.sendMail({
    from: `"Tiquera Web" <${sender.user}>`,
    to,
    subject,
    html,
    attachments,
  });
}

async function send(
  to: string[],
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: Buffer }>,
  sender?: SenderAuth | null,
): Promise<SendResult> {
  const recipients = to.filter((value) => value.length > 0);

  if (recipients.length === 0) {
    return { delivered: false, channel: "none", error: "Sin destinatarios." };
  }

  let lastError: string | undefined;

  // 1. Si el especialista/empleado tiene configurado su propio Gmail con clave de aplicación
  if (sender) {
    try {
      await sendViaGmail(sender, recipients, subject, html, attachments);
      return { delivered: true, channel: "user-gmail" };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(
        `[mail] Falló envío desde ${sender.user}, continuando con canales alternativos:`,
        error,
      );
    }
  }

  // 2. Canal de producción/transaccional: Resend (si está configurada la API Key)
  if (resendEnabled) {
    try {
      // Con el remitente de pruebas de Resend (onboarding@resend.dev), Resend sólo permite enviar
      // al correo registrado de la cuenta (STAFF_NOTIFICATION_EMAIL).
      const isTestDomain = env.mailFrom.toLowerCase().includes("onboarding@resend.dev");
      const targetRecipients =
        isTestDomain && env.staffNotificationEmail
          ? [env.staffNotificationEmail]
          : recipients;

      const resend = new Resend(env.resendApiKey);

      // Interceptar temporalmente console.error para evitar que el SDK de Resend active
      // el overlay de error de Next.js Turbopack si el servidor no tiene conexión o si la API responde error.
      const originalConsoleError = console.error;
      console.error = (...args: unknown[]) => {
        // Redirigir a warn para inspección sin que Next.js lo marque como pantalla roja de error
        console.warn("[resend-sdk-notice]:", ...args);
      };

      let resendResponse: { data: { id: string } | null; error: { message: string } | null } | undefined;
      try {
        resendResponse = await resend.emails.send({
          from: env.mailFrom,
          to: targetRecipients,
          subject,
          html,
          attachments: attachments?.map((att) => ({
            filename: att.filename,
            content: att.content,
          })),
        });
      } finally {
        console.error = originalConsoleError;
      }

      if (resendResponse?.error) {
        lastError = resendResponse.error.message;
        console.warn(`[mail] Aviso de Resend:`, resendResponse.error.message);
      } else if (resendResponse?.data) {
        console.log(
          `[mail] Correo enviado exitosamente con Resend a ${targetRecipients.join(", ")} (id: ${resendResponse.data.id})`,
        );
        return { delivered: true, channel: "resend" };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[mail] Aviso Resend (continuando con canales de respaldo):`, lastError);
    }
  }

  // 3. Gmail global
  if (gmailEnabled) {
    try {
      await sendViaGmail(
        { user: env.gmailUser, pass: env.gmailAppPassword },
        recipients,
        subject,
        html,
        attachments,
      );
      return { delivered: true, channel: "global-gmail" };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[mail] Falló envío desde Gmail global:`, error);
    }
  }

  // 4. Mailtrap (fallback de sandbox)
  if (mailtrapEnabled) {
    try {
      await sendViaMailtrap(recipients, subject, html, attachments);
      return { delivered: true, channel: "mailtrap" };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[mail] Falló envío con Mailtrap:`, error);
    }
  }

  console.warn(
    `[mail] Correo no enviado: ningún canal SMTP/Resend disponible para -> ${recipients.join(", ")} | ${subject}`,
  );

  return {
    delivered: false,
    channel: "none",
    error: lastError
      ? `No se pudo enviar el correo: ${lastError}`
      : "Correo no enviado: revisa tu API Key de Resend o configuración SMTP.",
  };
}

export type TicketClosedEmail = {
  to: string;
  code: string;
  title: string;
  status: "completed" | "expired";
  resolutionNotes: string | null;
  pdf: Buffer;
  sender?: SenderAuth | null;
};

export async function sendTicketClosedEmail(
  input: TicketClosedEmail,
): Promise<SendResult> {
  const isCompleted = input.status === "completed";
  const subject = isCompleted
    ? `[${input.code}] Ticket cumplido - ${input.title}`
    : `[${input.code}] Ticket cerrado por vencimiento de SLA - ${input.title}`;

  const headline = isCompleted
    ? "Tu reporte fue atendido y marcado como cumplido."
    : "Tu reporte supero las 24 horas de SLA y fue cerrado automaticamente.";

  const html = layout(
    subject,
    `
      <p style="margin:0 0 16px;">${escapeHtml(headline)}</p>
      <table style="border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Codigo</td><td>${escapeHtml(input.code)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Titulo</td><td>${escapeHtml(input.title)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Solucion</td><td>${escapeHtml(input.resolutionNotes ?? "Sin nota de resolucion.")}</td></tr>
      </table>
      <p style="margin:16px 0 0; color:#64748b; font-size:13px;">Adjuntamos el informe PDF con el detalle y el tiempo de atencion.</p>
    `,
  );

  return send(
    [input.to],
    subject,
    html,
    [{ filename: `${input.code}.pdf`, content: input.pdf }],
    input.sender,
  );
}

export type TicketMessageEmail = {
  to: string;
  code: string;
  ticketTitle: string;
  body: string;
  authorName: string;
  sender?: SenderAuth | null;
};

export async function sendTicketMessageEmail(
  input: TicketMessageEmail,
): Promise<SendResult> {
  const subject = `[${input.code}] Actualizacion de tu reporte - ${input.ticketTitle}`;

  const html = layout(
    subject,
    `
      <p style="margin:0 0 12px; color:#64748b; font-size:13px;">
        El equipo de soporte te envio una actualizacion o correccion sobre tu ticket.
      </p>
      <div style="border-left:4px solid #2563eb; background:#f8fafc; padding:12px 16px; border-radius:8px; white-space:pre-wrap;">${escapeHtml(input.body)}</div>
      <p style="margin:16px 0 0; color:#64748b; font-size:13px;">
        Puedes ver el detalle del ticket con el codigo ${escapeHtml(input.code)} en el seguimiento publico.
        Atendido por ${escapeHtml(input.authorName)}.
      </p>
    `,
  );

  return send([input.to], subject, html, undefined, input.sender);
}

export type StaffNotificationEmail = {
  recipients: string[];
  subject: string;
  body: string;
  sender?: SenderAuth | null;
};

export async function sendStaffNotificationEmail(
  input: StaffNotificationEmail,
): Promise<SendResult> {
  const targetRecipients = Array.from(
    new Set(
      [
        ...input.recipients,
        ...(env.staffNotificationEmail ? [env.staffNotificationEmail] : []),
      ].filter((email) => email && email.includes("@")),
    ),
  );

  const html = layout(
    input.subject,
    `
      <div style="background:#f8fafc; border-left:4px solid #2563eb; padding:12px 16px; border-radius:8px; margin-bottom:16px;">
        <p style="margin:0; font-size:14px; color:#1e293b; white-space:pre-wrap;">${escapeHtml(input.body)}</p>
      </div>
      <p style="margin:8px 0 0; color:#64748b; font-size:12px;">
        Notificación enviada al equipo de soporte de Tiquera Web.
      </p>
    `,
  );

  // Intentar envío prioritario por Resend / canales de email configurados
  if (resendEnabled || gmailEnabled) {
    const res = await send(targetRecipients, input.subject, html, undefined, input.sender);
    if (res.delivered) {
      return res;
    }
  }

  // Fallback a Formspree si los canales de correo directo no están activos
  const plainBody = [
    input.body,
    "",
    `Destinatarios: ${targetRecipients.join(", ")}`,
    "Entra al panel de Tiquera Web para ver el detalle.",
  ].join("\n");

  const result = await sendStaffNoticeToFormspree({
    subject: input.subject,
    body: plainBody,
    recipients: targetRecipients,
  });

  return {
    delivered: result.ok,
    channel: "formspree",
    error: result.error,
  };
}

export type StaffWelcomeEmail = {
  to: string;
  name: string;
  roleLabel: string;
  sender?: SenderAuth | null;
};

export async function sendStaffWelcomeEmail(
  input: StaffWelcomeEmail,
): Promise<SendResult> {
  const subject = "Bienvenido a Tiquera Web - Acceso al panel";

  const html = layout(
    subject,
    `
      <p style="margin:0 0 12px;">Hola ${escapeHtml(input.name)},</p>
      <p style="margin:0 0 12px;">
        Se creo tu cuenta en Tiquera Web con este correo. Utiliza este correo y la
        contrasena que te proporciono el administrador para ingresar al panel.
      </p>
      <table style="border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Correo de acceso</td><td>${escapeHtml(input.to)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#64748b;">Rol</td><td>${escapeHtml(input.roleLabel)}</td></tr>
      </table>
      <p style="margin:16px 0 0; color:#64748b; font-size:13px;">Recibiras en este correo las notificaciones de cierre y modificacion de tickets.</p>
    `,
  );

  return send([input.to], subject, html, undefined, input.sender);
}
