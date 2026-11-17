# 🎫 Tiquera Web — Sistema de Gestión de Tickets para Vionest Service

> **Plataforma oficial desarrollada a medida para Vionest Service.**  
> Sistema web moderno, rápido y profesional para la recepción, enrutamiento, seguimiento y resolución de incidencias y solicitudes de clientes en tiempo real.

Diseñada exclusivamente para **Vionest Service** con el objetivo de centralizar todo el soporte operativo en un tablero interactivo con control estricto de SLA (tiempos de respuesta de 24 horas), auditoría completa, generación de reportes en PDF y notificaciones automáticas por correo.

---

## 🚀 Características Principales

### 🌐 Para los Clientes (Portal Público)
- **Creación de Tickets en Segundos:** Formulario intuitivo sin necesidad de registro previo obligatorio.
- **Adjuntos y Evidencias:** Carga segura de capturas de pantalla, imágenes o documentos comprobatorios.
- **Seguimiento en Vivo:** Consulta del estado del ticket mediante un código alfanumérico único (`#ABC1234`).
- **Chat Bidireccional:** Notificaciones por correo electrónico cada vez que el equipo de soporte actualiza o responde su solicitud.
- **Informe de Cierre en PDF:** Generación y descarga automática de un informe formal en PDF al completarse el ticket con la solución documentada y sellos de tiempo.

### 🏢 Para el Equipo y Administradores (Panel Interno)
- **Tablero Visual por Estados (Estilo Kanban):** Columnas interactivas para *Pendientes*, *En Proceso*, *En Revisión*, *Cumplidos* y *Expirados / SLA*.
- **Diseño 100% Adaptativo (Mobile-First):** Experiencia fluida tanto en monitores de escritorio como en teléfonos móviles, con selector de estados rápido y tarjetas compactas.
- **Enrutamiento Estricto por Áreas:** Los tickets dirigidos a áreas específicas (Soporte Técnico, Facturación, Ventas, etc.) solo pueden ser asignados y gestionados por los especialistas correspondientes de esa área o por Superadministradores.
- **Control de SLA y Tiempos de Respuesta:** Cronómetros dinámicos de 24 horas con expiración automática de casos fuera de plazo.
- **Comunicación Integrada por Email:**
  - Envío desde el Gmail personal de cada especialista mediante *Claves de Aplicación*.
  - Servicio transaccional masivo de alta velocidad vía **Resend**.
  - Canal SMTP global corporativo y simulación local con **Mailtrap**.
  - Alertas instantáneas a administradores vía **Formspree**.
- **Gestión de Usuarios y Roles:** Control granular de accesos con perfiles de *Superadmin*, *Admin* y *Agente*.
- **Historial de Auditoría:** Registro cronológico detallado de cada movimiento, reasignación y cambio de estado.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Fullstack** | Next.js 16 (App Router + Turbopack + React 19) |
| **Lenguaje** | TypeScript |
| **Estilos & UI** | Tailwind CSS v4 |
| **Base de Datos & ORM** | Prisma ORM 7 + SQLite (desarrollo local y Vercel serverless) / PostgreSQL |
| **Generación de Documentos** | PDFKit (Reportes oficiales en PDF) |
| **Canales de Correo** | Resend API, Nodemailer (Gmail SMTP & Mailtrap), Formspree |
| **Despliegue** | Vercel |

---

## 📦 Estructura del Proyecto

```plaintext
tiquera-web/
├── prisma/
│   └── schema.prisma          # Definición de modelos de base de datos
├── public/                    # Logotipos, favicon y activos estáticos
├── src/
│   ├── app/
│   │   ├── (auth)/            # Vistas de autenticación (Login)
│   │   ├── (public)/          # Landing page y creación pública de tickets
│   │   ├── api/               # Endpoints REST (descarga de PDF, webhooks)
│   │   ├── panel/             # Panel administrativo, tablero Kanban y gestión
│   │   ├── tracking/          # Portal público de seguimiento para clientes
│   │   ├── layout.tsx         # Layout raíz con configuración de branding
│   │   └── page.tsx           # Página de inicio
│   ├── components/            # Componentes modulares (Kanban, Chat, Menús, Bells)
│   └── lib/                   # Lógica de negocio (DB, DAL, Auth, SLA, Mail, PDF)
├── .env.example               # Plantilla de variables de entorno
└── package.json
```

---

## ⚙️ Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/EdwyS22/Tiquera-Web.git
cd tiquera-web
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz tomando como base `.env.example`:

```env
# Base de datos
DATABASE_URL="file:./dev.db"

# Seguridad de sesiones (genera una cadena segura aleatoria)
SESSION_SECRET="tu-clave-secreta-super-segura-de-32-caracteres"

# Correo Principal con Resend (Opcional para desarrollo, recomendado en producción)
RESEND_API_KEY=""
MAIL_FROM="Tiquera Web <no-reply@tudominio.com>"

# Correo con Gmail (Opcional - Clave de Aplicación de 16 caracteres de Google)
GMAIL_USER=""
GMAIL_APP_PASSWORD=""

# Correo de prueba local (Mailtrap)
MAILTRAP_USER=""
MAILTRAP_PASS=""
MAILTRAP_HOST="sandbox.smtp.mailtrap.io"
MAILTRAP_PORT=2525
```

### 4. Generar cliente de base de datos y migración
```bash
npx prisma generate
npx prisma db push
```

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 👤 Acceso Inicial por Defecto (Entorno de Pruebas)

Al inicializar la base de datos se crea un usuario administrador predeterminado:

- **URL del Panel:** `/login`
- **Correo:** `admin@tiquera.local`
- **Contraseña:** `Admin12345`

*(Por motivos de seguridad, se recomienda cambiar estas credenciales una vez desplegado en producción).*

---

## 🚢 Despliegue en Vercel

El proyecto está 100% adaptado para desplegarse en Vercel con un solo clic:
1. Conecta tu repositorio de GitHub a tu cuenta de Vercel.
2. Agrega las variables de entorno (`SESSION_SECRET`, `RESEND_API_KEY`, etc.).
3. El comando de build configurado en `package.json` (`prisma generate && next build`) compilará y desplegará la plataforma automáticamente.

---

## 🏢 Propiedad y Derechos

Este proyecto es software privado de gestión empresarial desarrollado exclusivamente para **Vionest Service**. Todos los derechos reservados &copy; {new Date().getFullYear()} Vionest Service.
