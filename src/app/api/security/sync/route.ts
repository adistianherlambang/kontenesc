import { NextRequest, NextResponse } from "next/server";
import {
  extractClientIp,
  updateStoreNetwork,
  STORE_SYNC_SECRET,
} from "@/lib/storeSecurity";

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secretFromQuery = url.searchParams.get("secret");
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

    let secretFromBody = "";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        secretFromBody = body?.secret || "";
      } catch {
        // ignore non-json body
      }
    }

    const providedSecret = secretFromQuery || authHeader || secretFromBody;

    if (!providedSecret || providedSecret !== STORE_SYNC_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid secret key",
        },
        { status: 401 }
      );
    }

    const clientIp = extractClientIp(req);
    const updated = await updateStoreNetwork(clientIp);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to persist IP to database",
        },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    return NextResponse.json(
      {
        success: true,
        message: "Store Wi-Fi IP synchronized successfully",
        store: "Semarang Cell",
        ip: clientIp,
        synced_at: now,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
