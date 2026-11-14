import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

import { cloudinaryEnabled, env } from "@/lib/env";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export type UploadInput = {
  buffer: Buffer;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export type StoredFile = {
  fileUrl: string;
  publicId?: string;
};

export function validateAttachment(file: File): string | null {
  if (file.size === 0) {
    return `"${file.name}" esta vacio.`;
  }

  if (file.size > MAX_BYTES) {
    return `"${file.name}" supera el limite de 5MB.`;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return `"${file.name}" no es un formato permitido (imagenes o PDF).`;
  }

  return null;
}

export async function storeFile(input: UploadInput): Promise<StoredFile> {
  if (cloudinaryEnabled) {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });

    return new Promise<StoredFile>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: env.cloudinary.folder, resource_type: "auto" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Fallo la subida a Cloudinary."));
            return;
          }

          resolve({ fileUrl: result.secure_url, publicId: result.public_id });
        },
      );

      stream.end(input.buffer);
    });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${safeName}`;
  await writeFile(path.join(uploadDir, storedName), input.buffer);

  return { fileUrl: `/uploads/${storedName}` };
}
