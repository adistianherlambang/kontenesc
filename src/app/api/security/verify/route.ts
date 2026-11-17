import { NextRequest, NextResponse } from "next/server";
import {
  extractClientIp,
  getStoreNetwork,
  isLocalOrDevIp,
  cleanIp,
} from "@/lib/storeSecurity";

export async function GET(req: NextRequest) {
  try {
    const clientIp = extractClientIp(req);
    const storeNetwork = await getStoreNetwork();

    const isDev = process.env.NODE_ENV === "development";
    const isLocal = isLocalOrDevIp(clientIp);

    // In local development or local loopback, allow access for testing
    if (isDev && isLocal) {
      return NextResponse.json(
        {
          allowed: true,
          mode: "dev_local",
          client_ip: clientIp,
          store_ip: storeNetwork?.current_ip || "127.0.0.1",
          last_sync: storeNetwork?.updated_at || null,
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    if (!storeNetwork || !storeNetwork.current_ip) {
      // If store network hasn't been synced yet, block with guidance
      return NextResponse.json(
        {
          allowed: false,
          reason: "no_store_ip_registered",
          message:
            "IP Wi-Fi Toko belum terdaftar. Silakan lakukan sinkronisasi dari PC Kasir.",
          client_ip: clientIp,
        },
        { status: 403 }
      );
    }

    const matchesStore = cleanIp(clientIp) === cleanIp(storeNetwork.current_ip);

    if (matchesStore) {
      return NextResponse.json(
        {
          allowed: true,
          client_ip: clientIp,
          store_ip: storeNetwork.current_ip,
          last_sync: storeNetwork.updated_at,
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    // IP does not match store Wi-Fi
    return NextResponse.json(
      {
        allowed: false,
        reason: "outside_store_network",
        message:
          "Akses ditolak: Anda terhubung dari luar jaringan Wi-Fi Toko Semarang Cell.",
        client_ip: clientIp,
        last_sync: storeNetwork.updated_at,
      },
      { status: 403 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        allowed: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
