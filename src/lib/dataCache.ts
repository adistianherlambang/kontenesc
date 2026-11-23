import {
  ContentItem,
  LajulBrandDoc,
  LajulSummary,
  StokItem,
  StokSummary,
  getContentsFromDb,
  getLajulFromDb,
  getStokFromDb,
  seedContentsToDb,
} from "@/lib/firebase";
import { INITIAL_BRIEF_DATA } from "@/lib/initialData";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_CONTENTS = "semarang_cell_cache_contents_v1";
const CACHE_KEY_STOK = "semarang_cell_cache_stok_v1";
const CACHE_KEY_LAJUL = "semarang_cell_cache_lajul_v1";

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export interface StokCachePayload {
  items: StokItem[];
  summary: StokSummary | null;
}

export interface LajulCachePayload {
  brands: LajulBrandDoc[];
  summary: LajulSummary | null;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function readCache<T>(key: string, allowStale = false): T | null {
  const now = Date.now();
  const mem = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (mem && (allowStale || now - mem.timestamp < CACHE_TTL_MS)) {
    return mem.data;
  }

  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (
      parsed &&
      typeof parsed.timestamp === "number" &&
      "data" in parsed &&
      (allowStale || now - parsed.timestamp < CACHE_TTL_MS)
    ) {
      memoryCache.set(key, parsed);
      return parsed.data;
    }
  } catch {
    // Ignore storage read errors
  }

  return null;
}

function writeCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    timestamp: Date.now(),
    data,
  };
  memoryCache.set(key, entry);

  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  force = false
): Promise<{ data: T; fromCache: boolean }> {
  if (!force) {
    const fresh = readCache<T>(key, false);
    if (fresh !== null) {
      return { data: fresh, fromCache: true };
    }
  }

  if (isOffline()) {
    const stale = readCache<T>(key, true);
    if (stale !== null) {
      return { data: stale, fromCache: true };
    }
  }

  if (!force) {
    const existing = inFlightRequests.get(key) as Promise<T> | undefined;
    if (existing) {
      const data = await existing;
      return { data, fromCache: false };
    }
  }

  const requestPromise = (async () => {
    const data = await fetcher();
    writeCache(key, data);
    return data;
  })();

  inFlightRequests.set(key, requestPromise);

  try {
    const data = await requestPromise;
    return { data, fromCache: false };
  } catch (err) {
    const stale = readCache<T>(key, true);
    if (stale !== null) {
      return { data: stale, fromCache: true };
    }
    throw err;
  } finally {
    if (inFlightRequests.get(key) === requestPromise) {
      inFlightRequests.delete(key);
    }
  }
}

export async function fetchStokCached(
  force = false
): Promise<StokCachePayload & { fromCache: boolean }> {
  const { data, fromCache } = await fetchWithCache<StokCachePayload>(
    CACHE_KEY_STOK,
    () => getStokFromDb(true),
    force
  );
  return { ...data, fromCache };
}

export async function fetchLajulCached(
  force = false
): Promise<LajulCachePayload & { fromCache: boolean }> {
  const { data, fromCache } = await fetchWithCache<LajulCachePayload>(
    CACHE_KEY_LAJUL,
    () => getLajulFromDb(true),
    force
  );
  return { ...data, fromCache };
}

export async function fetchContentsCached(
  force = false
): Promise<{ items: ContentItem[]; fromCache: boolean }> {
  try {
    const { data, fromCache } = await fetchWithCache<ContentItem[]>(
      CACHE_KEY_CONTENTS,
      async () => {
        const remote = await getContentsFromDb();
        if (remote.length > 0) return remote;
        // Empty database on server: seed INITIAL_BRIEF_DATA once
        await seedContentsToDb(INITIAL_BRIEF_DATA).catch(console.error);
        return INITIAL_BRIEF_DATA;
      },
      force
    );
    return { items: data, fromCache };
  } catch {
    return { items: INITIAL_BRIEF_DATA, fromCache: true };
  }
}

export function setContentsCache(items: ContentItem[]): void {
  writeCache(CACHE_KEY_CONTENTS, items);
}
