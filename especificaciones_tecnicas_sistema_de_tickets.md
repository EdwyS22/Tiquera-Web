# Propuesta de Arquitectura y Desarrollo: Sistema de Tickets (Tiquera Web)

Este documento detalla la estructura, flujo de trabajo, arquitectura técnica y lenguajes recomendados para la tiquera web. El sistema está diseñado para el reporte público de incidencias en páginas web/landings y su gestión interna por parte del equipo técnico.

## 1. Módulos y Accesos

### 1.1. Módulo Público (Clientes / Usuarios Generales)

* **Sin Autenticación (Acceso Libre):**
  * Los usuarios no requieren registrarse ni iniciar sesión.
* **Creación de Tickets:**
  * Formulario público con: Título del problema, URL de la página afectada, correo electrónico de contacto (para recibir la resolución/PDF), categoría de la incidencia y descripción detallada.
  * Subida de evidencias (imágenes, capturas de pantalla, archivos).
* **Consulta Pública de Tickets:**
  * Buscador o lista pública de tickets creados mediante un enlace único (ej. `/ticket/TK-10293`) o listado general accesible para seguimiento.

### 1.2. Módulo de Gestión Interna (Trabajadores / Administradores)

* **Acceso Autenticado:** Restringido mediante correo institucional y contraseña (o SSO) para el personal autorizado de la empresa.
* **Panel de Control Interno (Dashboard):**
  * Vista centralizada de todos los tickets entrantes ordenados por prioridad y tiempo restante de SLA (24 horas).
  * Filtros por estado (*Pendiente*, *En Proceso*, *Cumplido*, *Expirado*).
* **Gestión de Respuestas y Estado:**
  * Asignación del ticket a un trabajador específico.
  * Espacio para notas internas (solo visibles para el equipo).
  * Cambio manual de estado a **Cumplido** al resolver el problema.

---

## 2. Flujo de Vida del Ticket y Automatizaciones

```
[ Formulario Público ] ──> Crea Ticket (Estado: Pendiente)
       │
       ├──── (Trabajador lo marca como "Cumplido" < 24h) ──> Estado: Cumplido ──┐
       │                                                                       │
       └──── (Sin resolución tras 24 horas) ─────────────> Estado: Expirado  ──┼─> [ Generar PDF ] ──> [ Enviar Correo ] ──> Ticket Cerrado
```

### 2.1. Reglas de Negocio para Cierre y Tareas Programadas

1. **Cierre Automático por Expiración (SLA de 24 Horas):**
   * Un servicio automatizado (*Worker Queue / Cron Job*) rastrea continuamente los tickets en estado *Pendiente* o *En Proceso*.
   * Si transcurren **24 horas desde la creación** sin que un trabajador lo marque como *Cumplido*, el sistema cambia automáticamente el estado a *Expirado/Cerrado*.

2. **Cierre Manual por Cumplimiento:**
   * El trabajador asignado resuelve el fallo y cambia el estado del ticket a **Cumplido**, gatillando el cierre inmediato.

3. **Gatillo de Cierre (Generación de PDF y Notificación):**
   * Al cerrar el ticket (ya sea por *Cumplido* o *Expirado*), el sistema:
     * **Genera un PDF:** Documento digital con los datos del reporte, tiempo transcurrido, resolución (si aplica) y fecha/hora de cierre.
     * **Envía un Correo Electrónico:** Notificación enviada automáticamente al correo ingresado en el formulario público con el PDF adjunto, notificando también al equipo técnico.

---

## 3. Lenguaje y Stack Tecnológico Recomendado

El stack recomendado es **TypeScript (Node.js / Next.js)** debido a su facilidad para manejar código estructurado tanto en backend como frontend, su alto rendimiento en la gestión de eventos asíncronos y sus librerías para generación de PDFs.

### Componentes del Stack:

* **Lenguaje Principal:** **TypeScript**
* **Framework Web:** **Next.js (React)** 
  * Permite la parte pública optimizada (Server-Side Rendering) y el panel privado con protección de rutas.
* **Base de Datos:** **PostgreSQL** administrado mediante **Prisma ORM**.
* **Gestión de SLA de 24 Horas:** **Redis + BullMQ** (Manejo de tareas en cola con temporizadores exactos de 24 horas).
* **Generación de PDFs:** `@react-pdf/renderer` o `Puppeteer` (Genera el PDF a partir de una plantilla HTML/React).
* **Servicio de Correos:** **Resend**, **SendGrid** o **Nodemailer (SMTP)**.
* **Almacenamiento de Evidencias:** **Cloudinary** o **Amazon S3**.

---

## 4. Modelo de Datos Simplificado (Base de Datos)

### Tabla: `Staff_Users` (Personal Autorizado)
* `id` (PK)
* `name`
* `email`
* `password_hash`
* `role` ('admin', 'agent')

### Tabla: `Tickets` (Públicos)
* `id` (PK)
* `ticket_code` (Unique, ej: `TK-1002`)
* `reporter_email` (Correo del usuario público que reporta)
* `landing_url` (Página/sitio web afectado)
* `title`
* `description`
* `status` ('pending', 'in_progress', 'completed', 'expired')
* `assigned_to` (FK $\rightarrow$ `Staff_Users.id`, Nullable)
* `resolution_notes` (Texto descriptivo escrito por el trabajador)
* `created_at` (Timestamp)
* `updated_at` (Timestamp)
* `closed_at` (Timestamp, Nullable)

### Tabla: `Attachments`
* `id` (PK)
* `ticket_id` (FK $\rightarrow$ `Tickets.id`)
* `file_url`
* `file_type`

---

## 5. Roadmap de Desarrollo Ajustado

1. **Fase 1: Módulo Público y Captura de Incidencias**
   * Formulario público de ticket con carga de archivos y generación de código de seguimiento único.
2. **Fase 2: Autenticación del Personal y Dashboard Interno**
   * Login exclusivo para trabajadores y panel de administración para gestionar tickets públicos.
3. **Fase 3: Temporizador de SLA (24 Horas)**
   * Integración de cola de tareas en Redis/BullMQ para marcar la expiración a las 24h exactas de cada ticket.
4. **Fase 4: Motor de PDFs y Notificaciones**
   * Configuración de la plantilla de PDF y envío automático por correo electrónico al cerrar el ticket.
5. **Fase 5: Pruebas e Implementación**
   * Pruebas de flujo completo (Creación pública $\rightarrow$ Gestión interna $\rightarrow$ Expiración/Cumplimiento $\rightarrow$ PDF/Correo).