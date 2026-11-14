export const env = {
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  formspreeEndpoint:
    process.env.FORMSPREE_ENDPOINT ?? "https://formspree.io/f/xbggpklg",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  mailFrom: process.env.MAIL_FROM ?? "Tiquera Web <no-reply@tiquera.local>",
  mailtrap: {
    host: process.env.MAILTRAP_HOST ?? "sandbox.smtp.mailtrap.io",
    port: Number(process.env.MAILTRAP_PORT ?? "2525"),
    user: process.env.MAILTRAP_USER ?? "",
    pass: process.env.MAILTRAP_PASS ?? "",
  },
  gmailUser: process.env.GMAIL_USER ?? "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  staffNotificationEmail: process.env.STAFF_NOTIFICATION_EMAIL ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    folder: process.env.CLOUDINARY_FOLDER ?? "tiquera/attachments",
  },
};

export const mailtrapEnabled =
  env.mailtrap.user.length > 0 && env.mailtrap.pass.length > 0;

export const resendEnabled = env.resendApiKey.length > 0;

export const gmailEnabled =
  env.gmailUser.length > 0 && env.gmailAppPassword.length > 0;

export const cloudinaryEnabled =
  env.cloudinary.cloudName.length > 0 &&
  env.cloudinary.apiKey.length > 0 &&
  env.cloudinary.apiSecret.length > 0;
