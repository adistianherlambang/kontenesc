import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  getDocs, 
  getDocsFromServer,
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  onSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  Firestore
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCBvSxFrZ6OU3bqx36mGfKnXqPEz864ceg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "konten-semarang.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "konten-semarang",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "konten-semarang.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "415979779793",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:415979779793:web:fff1bde05dd36c36d5f7f0",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CV23917167"
};

// Initialize Firebase safely for Next.js SSR / Fast Refresh
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore with offline persistence enabled for seamless, offline-ready & online-first operation
let dbInstance: Firestore;
if (typeof window !== "undefined") {
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch {
    dbInstance = getFirestore(app);
  }
} else {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

export interface ContentItem {
  id?: string;
  no: number;
  kategori: string;
  judul: string;
  copywriting: string;
  ambience: string;
  caption: string;
  executed?: boolean; // Notion-style checkbox: true = konten sudah dieksekusi/tayang
  priority?: boolean; // Status prioritas (true = konten prioritas)
  platform?: "Instagram Feed" | "Instagram Carousel" | "Instagram Reels" | "Instagram Story";
  targetDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = "contents";

/**
 * Sanitizes a ContentItem to ensure no undefined values are sent to Firestore,
 * preventing any runtime write exceptions.
 */
export function sanitizeContentItem(item: ContentItem, docId?: string): ContentItem & { id: string } {
  const finalId = item.id || docId || `konten-${item.no}`;
  const now = new Date().toISOString();
  return {
    id: finalId,
    no: typeof item.no === "number" ? item.no : Number(item.no) || 0,
    kategori: item.kategori || "Lainnya",
    judul: item.judul || "",
    copywriting: item.copywriting || "",
    ambience: item.ambience || "",
    caption: item.caption || "",
    executed: Boolean(item.executed),
    priority: Boolean(item.priority),
    platform: item.platform || "Instagram Feed",
    targetDate: item.targetDate || "",
    notes: item.notes || "",
    createdAt: item.createdAt || item.updatedAt || now,
    updatedAt: item.updatedAt || now
  };
}

export interface SnapshotMetadataInfo {
  isFromCache: boolean;
  hasPendingWrites: boolean;
}

/**
 * Real-time listener for Firestore contents collection.
 * Delivers instantaneous updates whenever online or offline, and reports
 * whether pending writes exist waiting to upload to the server.
 */
export function subscribeToContents(
  onUpdate: (items: ContentItem[], info: SnapshotMetadataInfo) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const items: ContentItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ContentItem, "id">)
      }));
      onUpdate(items, {
        isFromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      });
    },
    (err) => {
      console.warn("Firestore snapshot listener error:", err);
      if (onError) onError(err);
    }
  );
}

// Test connection health
export async function checkFirestoreHealth(): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return { ok: true, count: snapshot.size };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghubungkan ke Firestore";
    return { ok: false, error: msg };
  }
}

async function fetchCollectionReliable(
  q: Query<DocumentData>
): Promise<QuerySnapshot<DocumentData>> {
  try {
    const serverSnap = await getDocsFromServer(q);
    if (!serverSnap.empty) return serverSnap;
  } catch {
    // Fall through to local cache / snapshot listener
  }

  try {
    const localSnap = await getDocs(q);
    if (!localSnap.empty) return localSnap;
  } catch {
    // Fall through to snapshot listener
  }

  return new Promise<QuerySnapshot<DocumentData>>((resolve, reject) => {
    let settled = false;
    let unsub: (() => void) | null = null;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsub?.();
      reject(new Error("Firestore fetch timed out"));
    }, 8000);

    unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (settled) return;
        if (!snapshot.empty || !snapshot.metadata.fromCache) {
          settled = true;
          clearTimeout(timer);
          unsub?.();
          resolve(snapshot);
        }
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        unsub?.();
        reject(err);
      }
    );
  });
}

// Fetch all contents from Firestore
export async function getContentsFromDb(): Promise<ContentItem[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await fetchCollectionReliable(q);
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ContentItem, "id">)
    }));
  } catch (err) {
    console.warn("Firestore fetch error:", err);
    throw err;
  }
}

// Save or Update a single content immediately
export async function saveContentToDb(item: ContentItem): Promise<string> {
  const docId = item.id || `konten-${item.no}`;
  const docRef = doc(db, COLLECTION_NAME, docId);
  const dataToSave = sanitizeContentItem(item, docId);

  try {
    // When offline, Firestore automatically writes to local cache and queues the upload.
    // We use a short timeout race so UI handlers never hang waiting for server ack.
    const writePromise = setDoc(docRef, dataToSave, { merge: true });
    await Promise.race([
      writePromise,
      new Promise((resolve) => setTimeout(resolve, 300))
    ]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.debug("Firestore write deferred to offline queue:", msg);
  }

  return docId;
}

// Delete a single content immediately
export async function deleteContentFromDb(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const deletePromise = deleteDoc(docRef);
    await Promise.race([
      deletePromise,
      new Promise((resolve) => setTimeout(resolve, 300))
    ]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.debug("Firestore delete deferred to offline queue:", msg);
  }
}

// Batch Seed or Sync (handles Firestore 500 items limit gracefully)
export async function seedContentsToDb(
  items: ContentItem[], 
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const CHUNK_SIZE = 400; // Well within 500 operations batch limit
  let count = 0;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docId = item.id || `konten-${item.no}`;
      const docRef = doc(db, COLLECTION_NAME, docId);
      const cleanData = sanitizeContentItem(item, docId);
      batch.set(docRef, cleanData, { merge: true });
      count++;
    }

    await batch.commit();
    if (onProgress) onProgress(count, items.length);
  }

  return count;
}


// ============================================================================
// STOK HANDPHONE & LAPORAN PENJUALAN (LAJUL) TYPES & HELPERS
// ============================================================================

export interface StokColorVariant {
  warna: string;
  qty: number;
}

export interface StokItem {
  id: string;
  brand: string;
  tipe: string;
  kategori?: string;
  total_stok: number;
  tanggal: string;
  rincian_warna: StokColorVariant[];
}

export interface StokSummary {
  tanggal: string;
  total_units: number;
  total_units_acc?: number;
  brand_totals: Record<string, number>;
  acc_brand_totals?: Record<string, number>;
  updated_at?: string;
}

export interface LajulTransaksi {
  no: number;
  rincian: string;
  user: string;
  metode: string;
  harga: number;
}

export interface LajulBrandDoc {
  brand_key: string;
  brand_name: string;
  tanggal: string;
  no_sell: boolean;
  total_transaksi: number;
  transaksi: LajulTransaksi[];
}

export interface LajulMetrics {
  cash: string;
  debit: string;
  transfer: string;
  total_payment: string;
  unit_terjual: number;
}

export interface LajulSummary {
  tanggal: string;
  metrics: LajulMetrics;
  total_rows?: number;
  updated_at?: string;
}

export async function getStokFromDb(
  throwOnError = false
): Promise<{ items: StokItem[]; summary: StokSummary | null }> {
  try {
    const q = query(collection(db, "stok"));
    const snapshot = throwOnError
      ? await fetchCollectionReliable(q)
      : await getDocs(q);
    let summary: StokSummary | null = null;
    const items: StokItem[] = [];

    snapshot.docs.forEach((docSnap) => {
      if (docSnap.id === "ringkasan") {
        summary = docSnap.data() as StokSummary;
      } else {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          brand: d.brand || "Lainnya",
          tipe: d.tipe || "",
          kategori: typeof d.kategori === "string" && d.kategori.trim() ? d.kategori.trim().toLowerCase() : "handphone",
          total_stok: Number(d.total_stok) || 0,
          tanggal: d.tanggal || "",
          rincian_warna: Array.isArray(d.rincian_warna) ? d.rincian_warna : [],
        });
      }
    });

    items.sort((a, b) =>
      a.tipe.localeCompare(b.tipe, undefined, { numeric: true, sensitivity: "base" })
    );

    return { items, summary };
  } catch (err) {
    console.warn("Error fetching stok:", err);
    if (throwOnError) throw err;
    return { items: [], summary: null };
  }
}

export function subscribeToStok(
  onUpdate: (data: { items: StokItem[]; summary: StokSummary | null }) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "stok"));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      let summary: StokSummary | null = null;
      const items: StokItem[] = [];

      snapshot.docs.forEach((docSnap) => {
        if (docSnap.id === "ringkasan") {
          summary = docSnap.data() as StokSummary;
        } else {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            brand: d.brand || "Lainnya",
            tipe: d.tipe || "",
            kategori: typeof d.kategori === "string" && d.kategori.trim() ? d.kategori.trim().toLowerCase() : "handphone",
            total_stok: Number(d.total_stok) || 0,
            tanggal: d.tanggal || "",
            rincian_warna: Array.isArray(d.rincian_warna) ? d.rincian_warna : [],
          });
        }
      });

      items.sort((a, b) =>
        a.tipe.localeCompare(b.tipe, undefined, { numeric: true, sensitivity: "base" })
      );

      onUpdate({ items, summary });
    },
    (err) => {
      console.warn("Firestore stok snapshot listener error:", err);
      if (onError) onError(err);
    }
  );
}

export async function getLajulFromDb(
  throwOnError = false
): Promise<{ brands: LajulBrandDoc[]; summary: LajulSummary | null }> {
  try {
    const q = query(collection(db, "lajul"));
    const snapshot = throwOnError
      ? await fetchCollectionReliable(q)
      : await getDocs(q);
    let summary: LajulSummary | null = null;
    const brands: LajulBrandDoc[] = [];

    snapshot.docs.forEach((docSnap) => {
      if (docSnap.id === "ringkasan") {
        summary = docSnap.data() as LajulSummary;
      } else {
        const d = docSnap.data();
        brands.push({
          brand_key: d.brand_key || docSnap.id,
          brand_name: d.brand_name || docSnap.id,
          tanggal: d.tanggal || "",
          no_sell: Boolean(d.no_sell),
          total_transaksi: Number(d.total_transaksi) || 0,
          transaksi: Array.isArray(d.transaksi) ? d.transaksi : [],
        });
      }
    });

    return { brands, summary };
  } catch (err) {
    console.warn("Error fetching lajul:", err);
    if (throwOnError) throw err;
    return { brands: [], summary: null };
  }
}

export function subscribeToLajul(
  onUpdate: (data: { brands: LajulBrandDoc[]; summary: LajulSummary | null }) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "lajul"));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      let summary: LajulSummary | null = null;
      const brands: LajulBrandDoc[] = [];

      snapshot.docs.forEach((docSnap) => {
        if (docSnap.id === "ringkasan") {
          summary = docSnap.data() as LajulSummary;
        } else {
          const d = docSnap.data();
          brands.push({
            brand_key: d.brand_key || docSnap.id,
            brand_name: d.brand_name || docSnap.id,
            tanggal: d.tanggal || "",
            no_sell: Boolean(d.no_sell),
            total_transaksi: Number(d.total_transaksi) || 0,
            transaksi: Array.isArray(d.transaksi) ? d.transaksi : [],
          });
        }
      });

      onUpdate({ brands, summary });
    },
    (err) => {
      console.warn("Firestore lajul snapshot listener error:", err);
      if (onError) onError(err);
    }
  );
}
