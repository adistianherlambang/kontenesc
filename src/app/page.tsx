"use client";

import React, { useState, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
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
  subscribeToContents,
  SnapshotMetadataInfo 
} from "@/lib/firebase";
import { INITIAL_BRIEF_DATA } from "@/lib/initialData";
import { 
  Search, 
  LayoutGrid, 
  AlignJustify, 
  Plus, 
  Menu, 
  X,
  Cloud,
  CloudOff,
  CheckCircle2
} from "lucide-react";

function runWithViewTransition(updateFn: () => void) {
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition === "function"
  ) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      flushSync(() => {
        updateFn();
      });
    });
  } else {
    updateFn();
  }
}

const STORAGE_KEY = "semarang_cell_brief_contents_v3";

export default function DashboardPage() {
  // Cold-start fallback from localStorage or INITIAL_BRIEF_DATA for instant 0ms initial render
  const [items, setItems] = useState<ContentItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Error reading cold-start cache", e);
      }
    }
    return INITIAL_BRIEF_DATA;
  });

  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "offline" | "syncing">(() => {
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      return "offline";
    }
    return "offline";
  });

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

  // Real-time Firestore subscription with offline persistence & online sync
  useEffect(() => {
    let isMounted = true;

    const handleOnline = () => {
      // Let snapshot metadata or pending writes determine status
      setFirebaseStatus((prev) => (prev === "offline" ? "syncing" : prev));
    };

    const handleOffline = () => {
      setFirebaseStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to Firestore collection directly
    const unsubscribe = subscribeToContents(
      (remoteItems, info: SnapshotMetadataInfo) => {
        if (!isMounted) return;

        if (remoteItems.length > 0) {
          setItems(remoteItems);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteItems));
          } catch (e) {
            console.warn("Storage write error", e);
          }
        } else if (!info.isFromCache) {
          // Empty database on server: auto-seed INITIAL_BRIEF_DATA once
          seedContentsToDb(INITIAL_BRIEF_DATA).catch(console.error);
        }

        // Update real-time connection status
        if (typeof window !== "undefined" && !window.navigator.onLine) {
          setFirebaseStatus("offline");
        } else if (info.hasPendingWrites) {
          setFirebaseStatus("syncing");
        } else {
          setFirebaseStatus("connected");
        }
      },
      (err) => {
        console.warn("Firestore listener error:", err);
        if (typeof window !== "undefined" && !window.navigator.onLine) {
          setFirebaseStatus("offline");
        }
      }
    );

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  const updateItemsState = (updater: ContentItem[] | ((prev: ContentItem[]) => ContentItem[])) => {
    setItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Could not write to local cache", e);
      }
      return next;
    });
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

  // Toggle execution checkbox with View Transition (fade out left + shift neighbors up/left)
  const handleToggleExecuted = (item: ContentItem, explicitExecuted?: boolean) => {
    const newExecuted = typeof explicitExecuted === "boolean" ? explicitExecuted : !Boolean(item.executed);
    const now = new Date().toISOString();
    const updated: ContentItem = { 
      ...item, 
      executed: newExecuted, 
      updatedAt: now 
    };

    runWithViewTransition(() => {
      updateItemsState((prev) => prev.map((i) => ((i.id && i.id === item.id) || i.no === item.no ? updated : i)));
      if (previewItem && ((previewItem.id && previewItem.id === item.id) || previewItem.no === item.no)) {
        setPreviewItem(updated);
      }
    });

    // Save directly to Firestore (queued in IndexedDB if offline, auto-uploaded when online)
    saveContentToDb(updated).catch((err) => {
      console.warn("Firestore save error:", err);
    });
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
      id: savedItem.id || `konten-${savedItem.no}`,
      updatedAt: savedItem.updatedAt || new Date().toISOString()
    };

    runWithViewTransition(() => {
      updateItemsState((prev) => {
        const existingIndex = prev.findIndex((i) => (i.id && i.id === itemToSave.id) || i.no === itemToSave.no);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...itemToSave };
          return next;
        }
        return [...prev, itemToSave].sort((a, b) => a.no - b.no);
      });

      if (previewItem && ((previewItem.id && previewItem.id === itemToSave.id) || previewItem.no === itemToSave.no)) {
        setPreviewItem(itemToSave);
      }
    });

    await saveContentToDb(itemToSave);
  };

  const handleSaveBatch = async (batchItems: ContentItem[]) => {
    runWithViewTransition(() => {
      updateItemsState((prev) => {
        const itemMap = new Map<number, ContentItem>();
        prev.forEach((it) => itemMap.set(it.no, it));
        batchItems.forEach((it) => itemMap.set(it.no, it));
        return Array.from(itemMap.values()).sort((a, b) => a.no - b.no);
      });
    });

    await seedContentsToDb(batchItems);
  };

  const handleDeleteClick = (item: ContentItem) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const itemToDelete = deletingItem;
    setIsDeleting(true);

    runWithViewTransition(() => {
      updateItemsState((prev) =>
        prev.filter((i) => (i.id ? i.id !== itemToDelete.id : i.no !== itemToDelete.no))
      );
      setDeletingItem(null);
      setIsDeleting(false);
    });

    const docId = itemToDelete.id || `konten-${itemToDelete.no}`;
    await deleteContentFromDb(docId);
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
      updateItemsState(remote);
    }
    setFirebaseStatus("connected");
  };

  const handleResetToDefault = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("semarang_cell_brief_contents_v2");
    } catch (e) {
      console.warn("Reset error", e);
    }
    setFirebaseStatus("syncing");
    await seedContentsToDb(INITIAL_BRIEF_DATA);
    setFirebaseStatus("connected");
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

          {/* Right Actions: Cloud Sync (Mobile), View switch & Tambah Konten */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Cloud Sync Status Button (Mobile shortcut) */}
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="md:hidden p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-[#F0F0F2] border border-[#E4E4E7] text-[#18181B] active:bg-[#E4E4E7] cursor-pointer"
              title="Data & Sinkronisasi Cloud"
              aria-label="Data & Sinkronisasi Cloud"
            >
              {firebaseStatus === "connected" ? (
                <Cloud className="w-4 h-4 text-emerald-600" />
              ) : (
                <CloudOff className="w-4 h-4 text-[#71717A]" />
              )}
            </button>

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
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2 min-h-[40px] sm:min-h-[36px] rounded-xl text-xs font-semibold bg-[#1F6FB6] hover:bg-[#185A94] active:bg-[#185A94] text-white shadow-xs transition-colors select-none cursor-pointer"
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
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-base bg-[#F4F4F6] border border-transparent focus:border-[#D4D4D8] focus:bg-white text-[#18181B] placeholder-[#A1A1AA] outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#71717A] hover:text-[#18181B] active:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 w-full md:hidden overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveSidebarView("all")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                activeSidebarView === "all"
                  ? "bg-[#18181B] text-white"
                  : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarView("pending")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                activeSidebarView === "pending"
                  ? "bg-[#1F6FB6] text-white"
                  : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
              }`}
            >
              Belum ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarView("executed")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                activeSidebarView === "executed"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
              }`}
            >
              Selesai ({executedCount})
            </button>
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
                className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-black cursor-pointer"
              >
                Tampilkan Semua Konten
              </button>
            </div>
          ) : viewMode === "grid" ? (
            activeSidebarView === "all" ? (
              <div className="space-y-8 pb-24">
                {/* Active / Unexecuted Cards */}
                {filteredItems.filter((i) => !i.executed).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredItems
                      .filter((i) => !i.executed)
                      .map((item) => (
                        <ContentCard
                          key={`active-${item.id || item.no}`}
                          item={item}
                          transitionPrefix="active-card"
                          onToggleExecuted={handleToggleExecuted}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteClick}
                          onPreview={(it: ContentItem) => setPreviewItem(it)}
                          onOpen={(it: ContentItem) => setPreviewItem(it)}
                        />
                      ))}
                  </div>
                )}

                {/* Completed / Executed Cards Section */}
                {filteredItems.filter((i) => Boolean(i.executed)).length > 0 && (
                  <section className="space-y-4 pt-2 border-t border-[#ECEBE8]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#71717A]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Sudah Dieksekusi ({filteredItems.filter((i) => Boolean(i.executed)).length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 opacity-80">
                      {filteredItems
                        .filter((i) => Boolean(i.executed))
                        .map((item) => (
                          <ContentCard
                            key={`done-${item.id || item.no}`}
                            item={item}
                            transitionPrefix="done-card"
                            onToggleExecuted={handleToggleExecuted}
                            onEdit={handleOpenEdit}
                            onDelete={handleDeleteClick}
                            onPreview={(it: ContentItem) => setPreviewItem(it)}
                            onOpen={(it: ContentItem) => setPreviewItem(it)}
                          />
                        ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 pb-24">
                {filteredItems.map((item) => (
                  <ContentCard
                    key={item.id || item.no}
                    item={item}
                    transitionPrefix={activeSidebarView === "executed" ? "done-card" : "active-card"}
                    onToggleExecuted={handleToggleExecuted}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteClick}
                    onPreview={(it: ContentItem) => setPreviewItem(it)}
                    onOpen={(it: ContentItem) => setPreviewItem(it)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="pb-24">
              <ContentTable
                items={
                  activeSidebarView === "all"
                    ? [
                        ...filteredItems.filter((i) => !i.executed),
                        ...filteredItems.filter((i) => Boolean(i.executed)),
                      ]
                    : filteredItems
                }
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
