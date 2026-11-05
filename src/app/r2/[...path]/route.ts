import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName } from "@/lib/r2";
import { Readable } from "stream";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    if (!path || path.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const rawPath = path.map(decodeURIComponent).join("/");
    const client = getR2Client();
    const bucket = getR2BucketName();

    const candidateKeys = rawPath.startsWith("tocco_esc/")
      ? [rawPath, rawPath.replace(/^tocco_esc\//, "")]
      : [`tocco_esc/${rawPath}`, rawPath];

    let result: any = null;
    let lastErr: any = null;

    for (const key of candidateKeys) {
      try {
        result = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
        if (result && result.Body) {
          break;
        }
      } catch (err: any) {
        lastErr = err;
        if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) {
          continue;
        }
        throw err;
      }
    }

    if (!result || !result.Body) {
      return new NextResponse("File tidak ditemukan di R2", { status: 404 });
    }

    const contentType = result.ContentType || "image/jpeg";
    const cacheControl =
      result.CacheControl || "public, max-age=31536000, immutable";

    // Transform AWS SDK stream into Web ReadableStream for Next.js response
    let stream: any;
    if (result.Body instanceof Readable) {
      stream = Readable.toWeb(result.Body);
    } else if (result.Body?.transformToWebStream) {
      stream = await result.Body.transformToWebStream();
    } else {
      stream = result.Body;
    }

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (err: any) {
    console.error("R2 Proxy Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

