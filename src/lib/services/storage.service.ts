// src/lib/services/storage.service.ts
// StorageService — Cloudflare R2 (S3-compatible) image upload/delete
// Requisitos: 22.4

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// ─── Types ───────────────────────────────────────────────────

export interface UploadResult {
  key: string;
  url: string;
}

// ─── Constants ───────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── S3 Client (Cloudflare R2) ───────────────────────────────

function getS3Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucketName(): string {
  return process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'pueblo-delivery';
}

function getPublicUrl(key: string): string {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT ?? '';
  // R2 public URL pattern — adjust based on custom domain or R2 public access
  return `${endpoint}/${getBucketName()}/${key}`;
}

// ─── Service Functions ───────────────────────────────────────

/**
 * Validates file type and size before upload.
 * @throws Error if file type is not allowed or file is too large
 */
function validateFile(mimeType: string, size: number): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Tipo de archivo no permitido: ${mimeType}. Solo se permiten JPEG, PNG y WebP.`,
    );
  }

  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `El archivo es demasiado grande (${(size / 1024 / 1024).toFixed(1)} MB). Máximo permitido: 5 MB.`,
    );
  }
}

/**
 * Uploads a file to Cloudflare R2.
 *
 * @param file - The file buffer to upload
 * @param key - The storage key (path) for the file, e.g. "products/abc123.webp"
 * @param mimeType - The MIME type of the file
 * @returns The upload result with key and public URL
 */
export async function upload(
  file: Buffer,
  key: string,
  mimeType: string,
): Promise<UploadResult> {
  validateFile(mimeType, file.length);

  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: file,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return {
    key,
    url: getPublicUrl(key),
  };
}

/**
 * Deletes a file from Cloudflare R2.
 *
 * @param key - The storage key of the file to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );
}

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
