import { z } from "zod";

export const staffLoginSchema = z.object({
  email: z.email({ error: "Introduce un correo valido." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "La contrasena es obligatoria." }),
});

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, { error: "El titulo debe tener al menos 5 caracteres." })
    .max(140, { error: "El titulo no puede superar los 140 caracteres." })
    .trim(),
  landingUrl: z.url({ error: "Introduce una URL valida (https://...)." }).trim(),
  reporterEmail: z.email({ error: "Introduce un correo valido." }).trim().toLowerCase(),
  area: z
    .enum(["estrategia", "tecnologia", "marketing", "finanzas", "auto"])
    .optional(),
  product: z.string().trim().max(120).optional(),
  category: z
    .enum(["diseno", "funcionalidad", "contenido", "performance", "auto"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "auto"]).optional(),
  description: z
    .string()
    .min(15, { error: "Describe el problema con al menos 15 caracteres." })
    .max(4000, { error: "La descripcion es demasiado larga." })
    .trim(),
});

export const assignTicketSchema = z.object({
  ticketId: z.string().min(1),
  assignedToId: z.string().optional(),
});

export const noteSchema = z.object({
  ticketId: z.string().min(1),
  body: z
    .string()
    .min(2, { error: "La nota no puede estar vacia." })
    .max(2000, { error: "La nota es demasiado larga." })
    .trim(),
});

export const resolveTicketSchema = z.object({
  ticketId: z.string().min(1),
  resolutionNotes: z
    .string()
    .min(5, { error: "Describe la resolucion antes de cerrar el ticket." })
    .max(4000, { error: "La resolucion es demasiado larga." })
    .trim(),
});

export const statusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["pending", "in_progress", "in_review"]),
});

export const updateTicketSchema = z.object({
  ticketId: z.string().min(1),
  title: z
    .string()
    .min(5, { error: "El titulo debe tener al menos 5 caracteres." })
    .max(140, { error: "El titulo no puede superar los 140 caracteres." })
    .trim(),
  landingUrl: z.url({ error: "Introduce una URL valida (https://...)." }).trim(),
  reporterEmail: z
    .email({ error: "Introduce un correo valido." })
    .trim()
    .toLowerCase(),
  area: z.enum(["estrategia", "tecnologia", "marketing", "finanzas"], {
    error: "Selecciona el area de la empresa.",
  }),
  product: z.string().trim().max(120).optional(),
  category: z.enum(["diseno", "funcionalidad", "contenido", "performance"]),
  priority: z.enum(["low", "medium", "high"]),
  description: z
    .string()
    .min(15, { error: "Describe el problema con al menos 15 caracteres." })
    .max(4000, { error: "La descripcion es demasiado larga." })
    .trim(),
});

export const messageSchema = z.object({
  ticketId: z.string().min(1),
  body: z
    .string()
    .min(2, { error: "El mensaje no puede estar vacio." })
    .max(4000, { error: "El mensaje es demasiado largo." })
    .trim(),
});

export const createStaffUserSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Introduce el nombre." })
    .max(80, { error: "El nombre es demasiado largo." })
    .trim(),
  email: z.email({ error: "Introduce un correo valido." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "La contrasena debe tener al menos 8 caracteres." })
    .max(100, { error: "La contrasena es demasiado larga." }),
  role: z.enum(["superadmin", "admin", "agent"], {
    error: "Selecciona un rol valido.",
  }),
  area: z.enum(["estrategia", "tecnologia", "marketing", "finanzas"], {
    error: "Selecciona un area valida.",
  }).default("tecnologia"),
  mailAppPassword: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => value === "" || value.length >= 16, {
      error: "La clave de aplicacion de Gmail debe tener 16 caracteres.",
    })
    .optional(),
});

export const setStaffUserAreaSchema = z.object({
  userId: z.string().min(1),
  area: z.enum(["estrategia", "tecnologia", "marketing", "finanzas"], {
    error: "Selecciona un area valida.",
  }),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  password: z
    .string()
    .min(8, { error: "La contrasena debe tener al menos 8 caracteres." })
    .max(100, { error: "La contrasena es demasiado larga." }),
});

export const toggleUserSchema = z.object({
  userId: z.string().min(1),
});

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

export const setMailPasswordSchema = z.object({
  userId: z.string().min(1),
  mailAppPassword: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => value === "" || value.length >= 16, {
      error: "La clave de aplicacion de Gmail debe tener 16 caracteres.",
    }),
});

export type FormState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
      ok?: boolean;
      data?: Record<string, unknown>;
    }
  | undefined;
