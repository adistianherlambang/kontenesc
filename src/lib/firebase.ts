import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  onSnapshot,
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
  platform?: "Instagram Feed" | "Instagram Carousel" | "Instagram Reels" | "Instagram Story";
  targetDate?: string;
  notes?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = "contents";

/**
 * Sanitizes a ContentItem to ensure no undefined values are sent to Firestore,
 * preventing any runtime write exceptions.
 */
export function sanitizeContentItem(item: ContentItem, docId?: string): ContentItem & { id: string } {
  const finalId = item.id || docId || `konten-${item.no}`;
  return {
    id: finalId,
    no: typeof item.no === "number" ? item.no : Number(item.no) || 0,
    kategori: item.kategori || "Lainnya",
    judul: item.judul || "",
    copywriting: item.copywriting || "",
    ambience: item.ambience || "",
    caption: item.caption || "",
    executed: Boolean(item.executed),
    platform: item.platform || "Instagram Feed",
    targetDate: item.targetDate || "",
    notes: item.notes || "",
    updatedAt: item.updatedAt || new Date().toISOString()
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
  const q = query(collection(db, COLLECTION_NAME), orderBy("no", "asc"));
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

// Fetch all contents from Firestore
export async function getContentsFromDb(): Promise<ContentItem[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("no", "asc"));
    const snapshot = await getDocs(q);
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
