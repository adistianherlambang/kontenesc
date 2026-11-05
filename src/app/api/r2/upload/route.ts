import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, sanitizeSkuForFilename } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sku = (formData.get("sku") as string) || "UNIT";
    const index = parseInt((formData.get("index") as string) || "1", 10) || 1;

    if (!file) {
      return NextResponse.json(
        { error: "Berkas gambar tidak ditemukan." },
        { status: 400 }
      );
    }

    const mime = file.type || "image/jpeg";
    let ext = "jpg";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("webp")) ext = "webp";
    else if (mime.includes("gif")) ext = "gif";
    else if (file.name.includes(".")) {
      const parts = file.name.split(".");
      ext = parts[parts.length - 1].toLowerCase();
    }

    const cleanSku = sanitizeSkuForFilename(sku);
    const filename = `${cleanSku}_${index}.${ext}`;
    const key = `tocco_esc/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const client = getR2Client();
    const bucket = getR2BucketName();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return NextResponse.json({
      success: true,
      key,
      filename,
      path: `/r2/${filename}`,
    });
  } catch (err: any) {
    console.error("R2 Upload Error:", err);
    return NextResponse.json(
      { error: err?.message || "Gagal mengunggah gambar ke R2." },
      { status: 500 }
    );
  }
}
