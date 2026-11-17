import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const STORE_SYNC_SECRET =
  process.env.STORE_SYNC_SECRET || "semarang-cell-store-sec-2026";

export interface StoreNetworkData {
  current_ip: string;
  updated_at: string;
  store: string;
  sync_secret?: string;
}

/**
 * Normalizes IPv4 / IPv6 addresses, removing ::ffff: prefixes.
 */
export function cleanIp(ip: string): string {
  let cleaned = (ip || "").trim();
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.substring(7);
  }
  return cleaned;
}

/**
 * Extracts client public IP from Next.js request headers.
 */
export function extractClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    return cleanIp(firstIp);
  }

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cleanIp(cfConnectingIp);

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return cleanIp(realIp);

  return "127.0.0.1";
}

/**
 * Checks if an IP is localhost or a private RFC1918 LAN range (allowed during local dev).
 */
export function isLocalOrDevIp(ip: string): boolean {
  const cleaned = cleanIp(ip);
  return (
    cleaned === "127.0.0.1" ||
    cleaned === "::1" ||
    cleaned === "localhost" ||
    cleaned.startsWith("192.168.") ||
    cleaned.startsWith("10.") ||
    cleaned.startsWith("172.16.")
  );
}

/**
 * Retrieves the currently registered Store Wi-Fi public IP from Firestore.
 */
export async function getStoreNetwork(): Promise<StoreNetworkData | null> {
  try {
    const docRef = doc(db, "security", "store_network");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StoreNetworkData;
    }
    return null;
  } catch (err) {
    console.warn("Failed to get store network from Firestore:", err);
    return null;
  }
}

/**
 * Updates the Store Wi-Fi public IP in Firestore.
 */
export async function updateStoreNetwork(ip: string): Promise<boolean> {
  try {
    const docRef = doc(db, "security", "store_network");
    const data: StoreNetworkData = {
      current_ip: cleanIp(ip),
      updated_at: new Date().toISOString(),
      store: "Semarang Cell",
    };
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to update store network in Firestore:", err);
    return false;
  }
}
