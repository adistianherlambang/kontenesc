"use client";

import React, { useState, useEffect, useMemo } from "react";
import Sidebar, { StatusView } from "@/components/Sidebar";
import ContentCard from "@/components/ContentCard";
import ContentTable from "@/components/ContentTable";
import ContentDetailModal from "@/components/ContentDetailModal";
import ContentModal from "@/components/ContentModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import FirebaseSyncModal from "@/components/FirebaseSyncModal";
import { 
  ContentItem, 
  getContentsFromDb, 
  saveContentToDb, 
  deleteContentFromDb, 
  seedContentsToDb,
  checkFirestoreHealth 
} from "@/lib/firebase";
import { INITIAL_BRIEF_DATA } from "@/lib/initialData";
import { 
  Search, 
  LayoutGrid, 
  AlignJustify, 
  Plus, 
  Menu, 
  X
} from "lucide-react";

const STORAGE_KEY = "semarang_cell_brief_contents_v3";
const DELETED_KEY = "semarang_cell_deleted_nos_v3";

function getDeletedNos(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    console.warn("Error reading deleted nos", e);
  }
  return new Set();
}

function saveDeletedNos(set: Set<number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn("Error saving deleted nos", e);
  }
}

/**
 * Intelligently merges base brief data (60 items) with incoming cached or remote data.
 * Guarantees that items from the initial brief are NEVER accidentally wiped when only
 * 1 or a few items were saved/synchronized.
 */
function mergeWithBaseData(incoming: ContentItem[], deletedSet: Set<number>): ContentItem[] {
  const map = new Map<number, ContentItem>();

  // 1. Seed with all 60 base brief items (unless deleted)
  for (const base of INITIAL_BRIEF_DATA) {
    if (!deletedSet.has(base.no)) {
      map.set(base.no, { ...base });
    }
  }

  // 2. Overlay incoming items (edits, execution toggle, new additions)
  for (const item of incoming) {
    if (!item || typeof item.no !== "number") continue;
    if (deletedSet.has(item.no)) continue;

    const existing = map.get(item.no);
    if (existing) {
      map.set(item.no, { ...existing, ...item });
    } else {
      map.set(item.no, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.no - b.no);
}

/**
 * Merges local cached items with remote Firestore items using Last-Write-Wins (LWW)
 * conflict resolution based on `updatedAt` timestamp.
 * Guarantees that:
 * 1. Base brief data (60 items) is preserved as foundation.
 * 2. Deleted items are never restored.
 * 3. Recent local modifications (edits or checklists) take precedence over older remote reads.
 * 4. Strictly newer remote updates are incorporated.
 */
function mergeLocalAndRemote(
  localList: ContentItem[],
  remoteList: ContentItem[],
  deletedSet: Set<number>
): ContentItem[] {
  const map = new Map<number, ContentItem>();

  // 1. Seed with base brief data
  for (const base of INITIAL_BRIEF_DATA) {
    if (!deletedSet.has(base.no)) {
      map.set(base.no, { ...base });
    }
  }

  // 2. Overlay local items (guarantees local state is foundation)
  for (const local of localList) {
    if (!local || typeof local.no !== "number") continue;
    if (deletedSet.has(local.no)) continue;
    const existing = map.get(local.no);
    map.set(local.no, existing ? { ...existing, ...local } : { ...local });
  }

  // 3. Merge remote items using timestamp comparison (Last-Write-Wins)
  for (const remote of remoteList) {
    if (!remote || typeof remote.no !== "number") continue;
    if (deletedSet.has(remote.no)) continue;

    const existing = map.get(remote.no);
    if (!existing) {
      map.set(remote.no, { ...remote });
      continue;
    }

    const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    const localTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

    // Remote only overwrites if strictly newer than local
    if (remoteTime > localTime) {
      map.set(remote.no, { ...existing, ...remote });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.no - b.no);
}

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>(INITIAL_BRIEF_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "offline" | "syncing">("offline");

  // View & Nav State
  const [activeSidebarView, setActiveSidebarView] = useState<StatusView>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedPlatform, setSelectedPlatform] = useState("Semua");

  // Modals
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 1. Initial Load
  useEffect(() => {
    let currentData: ContentItem[] = [];
    try {
      const deletedSet = getDeletedNos();
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentData = mergeWithBaseData(parsed, deletedSet);
          setItems(currentData);
        } else {
          currentData = mergeWithBaseData([], deletedSet);
          setItems(currentData);
        }
      } else {
        // Also check v2 cache in case the user made edits in v2
        const v2Cached = localStorage.getItem("semarang_cell_brief_contents_v2");
        if (v2Cached) {
          const parsedV2 = JSON.parse(v2Cached);
          if (Array.isArray(parsedV2) && parsedV2.length > 0) {
            currentData = mergeWithBaseData(parsedV2, deletedSet);
            setItems(currentData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
          }
        } else {
          currentData = mergeWithBaseData([], deletedSet);
          setItems(currentData);
        }
      }
    } catch (e) {
      console.warn("Could not read local cache", e);
      currentData = INITIAL_BRIEF_DATA;
    }
    setIsLoaded(true);

    checkFirestore(currentData);
  }, []);

  const checkFirestore = async (localSnapshot?: ContentItem[]) => {
    try {
      const health = await checkFirestoreHealth();
      if (health.ok) {
        setFirebaseStatus("connected");
        if (health.count && health.count > 0) {
          const remoteItems = await getContentsFromDb();
          if (remoteItems.length > 0) {
            const deletedSet = getDeletedNos();
            const currentLocal = localSnapshot && localSnapshot.length > 0 ? localSnapshot : items;
            const merged = mergeLocalAndRemote(currentLocal, remoteItems, deletedSet);
            updateItemsState(merged);
          }
        }
      } else {
        setFirebaseStatus("offline");
      }
    } catch (err) {
      setFirebaseStatus("offline");
    }
  };

  const updateItemsState = (newItems: ContentItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn("Could not write to local cache", e);
    }
  };

  // Aggregations
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const cat = item.kategori || "Lainnya";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const executedCount = useMemo(() => {
    return items.filter(i => Boolean(i.executed)).length;
  }, [items]);

  const pendingCount = items.length - executedCount;

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Sidebar filter
      if (activeSidebarView === "pending" && item.executed) return false;
      if (activeSidebarView === "executed" && !item.executed) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.judul.toLowerCase().includes(q);
        const matchCopy = item.copywriting.toLowerCase().includes(q);
        const matchAmbience = item.ambience.toLowerCase().includes(q);
        const matchCaption = item.caption.toLowerCase().includes(q);
        const matchCat = (item.kategori || "").toLowerCase().includes(q);
        const matchNo = item.no.toString().includes(q);
        if (!matchTitle && !matchCopy && !matchAmbience && !matchCaption && !matchCat && !matchNo) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "Semua" && item.kategori !== selectedCategory) {
        return false;
      }

      // Platform filter
      if (selectedPlatform !== "Semua" && (item.platform || "Instagram Feed") !== selectedPlatform) {
        return false;
      }

      return true;
    }).sort((a, b) => a.no - b.no);
  }, [items, activeSidebarView, searchQuery, selectedCategory, selectedPlatform]);

  // Toggle execution checkbox
  const handleToggleExecuted = async (item: ContentItem, explicitExecuted?: boolean) => {
    const newExecuted = typeof explicitExecuted === "boolean" ? explicitExecuted : !Boolean(item.executed);
    const now = new Date().toISOString();
    const updated: ContentItem = { 
      ...item, 
      executed: newExecuted, 
      updatedAt: now 
    };
    const nextList = items.map(i => (i.no === item.no ? updated : i));
    updateItemsState(nextList);

    // Keep active previewItem in sync if detail modal is open
    if (previewItem && ((previewItem.id && previewItem.id === item.id) || previewItem.no === item.no)) {
      setPreviewItem(updated);
    }

    try {
      await saveContentToDb(updated);
    } catch (e) {
      // local first fallback
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsContentModalOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
    setEditingItem(item);
    setIsContentModalOpen(true);
  };

  const handleSaveSingle = async (savedItem: ContentItem) => {
    const itemToSave: ContentItem = {
      ...savedItem,
      updatedAt: savedItem.updatedAt || new Date().toISOString()
    };
    let nextList: ContentItem[];
    const existingIndex = items.findIndex(i => (i.id && i.id === itemToSave.id) || i.no === itemToSave.no);

    if (existingIndex >= 0) {
      nextList = [...items];
      nextList[existingIndex] = { ...itemToSave };
    } else {
      nextList = [...items, itemToSave];
    }

    updateItemsState(nextList);

    if (previewItem && ((previewItem.id && previewItem.id === itemToSave.id) || previewItem.no === itemToSave.no)) {
      setPreviewItem(itemToSave);
    }

    try {
      await saveContentToDb(itemToSave);
      setFirebaseStatus("connected");
    } catch (err) {
      console.warn("Save remote error", err);
    }
  };

  const handleSaveBatch = async (batchItems: ContentItem[]) => {
    const itemMap = new Map<number, ContentItem>();
    items.forEach(it => itemMap.set(it.no, it));
    batchItems.forEach(it => itemMap.set(it.no, it));

    const nextList = Array.from(itemMap.values()).sort((a, b) => a.no - b.no);
    updateItemsState(nextList);

    try {
      await seedContentsToDb(nextList);
      setFirebaseStatus("connected");
    } catch (e) {
      console.warn("Batch sync error", e);
    }
  };

  const handleDeleteClick = (item: ContentItem) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      const deletedSet = getDeletedNos();
      deletedSet.add(deletingItem.no);
      saveDeletedNos(deletedSet);

      const nextList = items.filter(i => (i.id ? i.id !== deletingItem.id : i.no !== deletingItem.no));
      updateItemsState(nextList);

      if (deletingItem.id) {
        try {
          await deleteContentFromDb(deletingItem.id);
        } catch (e) {
          console.warn("Delete remote error", e);
        }
      }
      setDeletingItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePushToFirebase = async () => {
    setFirebaseStatus("syncing");
    await seedContentsToDb(items);
    setFirebaseStatus("connected");
  };

  const handlePullFromFirebase = async () => {
    setFirebaseStatus("syncing");
    const remote = await getContentsFromDb();
    if (remote.length > 0) {
      const deletedSet = getDeletedNos();
      const merged = mergeLocalAndRemote(items, remote, deletedSet);
      updateItemsState(merged);
    }
    setFirebaseStatus("connected");
  };

  const handleResetToDefault = () => {
    try {
      localStorage.removeItem(DELETED_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("semarang_cell_brief_contents_v2");
    } catch (e) {
      console.warn("Reset error", e);
    }
    updateItemsState(INITIAL_BRIEF_DATA);
  };

  const nextSuggestedNo = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.no)) + 1;
  }, [items]);

  const viewTitle = useMemo(() => {
    switch (activeSidebarView) {
      case "pending": return "Belum Eksekusi";
      case "executed": return "Sudah Eksekusi";
      default: return "Semua Konten";
    }
  }, [activeSidebarView]);

  return (
    <div className="h-dvh w-full overflow-hidden flex bg-white text-[#18181B] font-sans">
      
      {/* Left Sidebar */}
      <Sidebar
        activeView={activeSidebarView}
        onSelectView={setActiveSidebarView}
        totalCount={items.length}
        pendingCount={pendingCount}
        executedCount={executedCount}
        firebaseStatus={firebaseStatus}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        categories={categoriesWithCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Right Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white">
        
        {/* Top Header: Clean, purposeful, mobile-friendly touch targets */}
        <header className="min-h-[60px] sm:h-[62px] px-4 sm:px-8 py-2.5 border-b border-[#ECEBE8] flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0 bg-white">
          
          {/* Left Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="md:hidden -ml-1 p-2.5 min-w-[42px] min-h-[42px] flex items-center justify-center text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-sm sm:text-base font-bold text-[#18181B] truncate">
              {viewTitle}
            </h2>
            <span className="text-xs text-gray-400 font-mono shrink-0">
              ({filteredItems.length})
            </span>
          </div>

          {/* Center Search Input (Desktop) */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari konten, judul, topik..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-[#F4F4F6] border border-transparent focus:border-[#D4D4D8] focus:bg-white text-[#18181B] placeholder-[#A1A1AA] outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#18181B] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Actions: View switch & Tambah Konten */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* View Mode Toggle ([|||] and [▦]) */}
            <div className="flex items-center p-1 bg-[#F0F0F2] rounded-xl border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 sm:p-1.5 min-w-[38px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
                }`}
                title="Tampilan Tabel"
                aria-label="Tampilan Tabel"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 sm:p-1.5 min-w-[38px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
                }`}
                title="Tampilan Kartu"
                aria-label="Tampilan Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Tambah Konten (Manual, Batch CSV, Batch JSON) */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2 min-h-[40px] sm:min-h-[36px] rounded-xl text-xs font-semibold bg-[#1F6FB6] hover:bg-[#185A94] active:bg-[#185A94] active:scale-[0.98] text-white shadow-xs transition-all select-none cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tambah Konten</span>
            </button>
          </div>

          {/* Mobile Search Input Row */}
          <div className="relative w-full sm:hidden">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari konten, judul, topik..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-[#F4F4F6] border border-transparent focus:border-[#D4D4D8] focus:bg-white text-[#18181B] placeholder-[#A1A1AA] outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#71717A] hover:text-[#18181B] active:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 sm:p-12 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border border-gray-200 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🔍
              </div>
              <h3 className="text-sm font-bold text-[#18181B] mb-1.5">
                Tidak ada konten ditemukan
              </h3>
              <p className="text-xs max-w-sm text-[#71717A] mb-5">
                Ubah kata kunci pencarian atau reset filter kategori untuk menampilkan data kembali.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                  setSelectedPlatform("Semua");
                  setActiveSidebarView("all");
                }}
                className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-black active:scale-[0.98] cursor-pointer"
              >
                Tampilkan Semua Konten
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 pb-24">
              {filteredItems.map((item) => (
                <ContentCard
                  key={item.id || item.no}
                  item={item}
                  onToggleExecuted={handleToggleExecuted}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                  onPreview={(it: ContentItem) => setPreviewItem(it)}
                  onOpen={(it: ContentItem) => setPreviewItem(it)}
                />
              ))}
            </div>
          ) : (
            <div className="pb-20">
              <ContentTable
                items={filteredItems}
                onToggleExecuted={handleToggleExecuted}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteClick}
                onPreview={(it: ContentItem) => setPreviewItem(it)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isContentModalOpen && (
        <ContentModal
          isOpen={isContentModalOpen}
          item={editingItem}
          onClose={() => setIsContentModalOpen(false)}
          onSaveSingle={handleSaveSingle}
          onSaveBatch={handleSaveBatch}
          existingCategories={categoriesWithCounts.map(c => c.name)}
          nextSuggestedNo={nextSuggestedNo}
        />
      )}

      {previewItem && (
        <ContentDetailModal
          item={previewItem}
          isOpen={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          onSave={async (updatedItem) => {
            await handleSaveSingle(updatedItem);
            setPreviewItem(updatedItem);
          }}
          onToggleExecuted={handleToggleExecuted}
          onDelete={handleDeleteClick}
          existingCategories={categoriesWithCounts.map(c => c.name)}
        />
      )}

      {deletingItem && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingItem)}
          item={deletingItem}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingItem(null)}
        />
      )}

      {isSyncModalOpen && (
        <FirebaseSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          firebaseStatus={firebaseStatus}
          localCount={items.length}
          onPushToFirebase={handlePushToFirebase}
          onPullFromFirebase={handlePullFromFirebase}
          onResetToDefault={handleResetToDefault}
        />
      )}
    </div>
  );
}
