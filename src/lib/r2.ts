import { S3Client } from "@aws-sdk/client-s3";

export function getR2Client(): S3Client {
  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Kredensial Cloudflare R2 belum lengkap di environment.");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getR2BucketName(): string {
  return process.env.R2_BUCKET_NAME || "adistianr2";
}

/**
 * Normalizes SKU to safe characters for file names and URLs.
 * Replaces '/' with '-' and spaces with '_'.
 */
export function sanitizeSkuForFilename(sku: string): string {
  return (sku || "SKU")
    .trim()
    .replace(/\//g, "-")
    .replace(/\\/g, "-")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-\.]/g, "");
}
