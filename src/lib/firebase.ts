import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy 
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

// Initialize Cloud Firestore
export const db = getFirestore(app);

export interface ContentItem {
  id?: string;
  no: number;
  kategori: string;
  judul: string;
  copywriting: string;
  ambience: string;
  caption: string;
  status?: "Draft" | "Siap Tayang" | "Terjadwal" | "Sudah Tayang";
  platform?: "Instagram Feed" | "Instagram Carousel" | "Instagram Reels" | "Instagram Story";
  targetDate?: string;
  notes?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = "contents";

// Test connection
export async function checkFirestoreHealth(): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return { ok: true, count: snapshot.size };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Gagal menghubungkan ke Firestore" };
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
    console.warn("Firestore fetch error, fallback to local:", err);
    throw err;
  }
}

// Save or Update a single content
export async function saveContentToDb(item: ContentItem): Promise<string> {
  const docId = item.id || `konten-${item.no}`;
  const docRef = doc(db, COLLECTION_NAME, docId);
  const dataToSave = {
    ...item,
    id: docId,
    updatedAt: new Date().toISOString()
  };
  await setDoc(docRef, dataToSave, { merge: true });
  return docId;
}

// Delete a single content
export async function deleteContentFromDb(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

// Batch Seed from brief.json (or array)
export async function seedContentsToDb(items: ContentItem[], onProgress?: (current: number, total: number) => void): Promise<number> {
  // Firestore batch limit is 500 operations, here we have 60 items
  const batch = writeBatch(db);
  let count = 0;

  for (const item of items) {
    const docId = `konten-${item.no}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    batch.set(docRef, {
      ...item,
      id: docId,
      status: item.status || "Siap Tayang",
      platform: item.platform || "Instagram Feed",
      updatedAt: new Date().toISOString()
    });
    count++;
  }

  await batch.commit();
  if (onProgress) onProgress(count, items.length);
  return count;
}
