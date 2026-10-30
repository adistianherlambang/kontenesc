"use client";

import React, { useState, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import Sidebar, { StatusView } from "@/components/Sidebar";
import ContentCard from "@/components/ContentCard";
import ContentTable from "@/components/ContentTable";
import ContentDetailModal from "@/components/ContentDetailModal";
import ContentModal from "@/components/ContentModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import HargaExtractorModal from "@/components/HargaExtractorModal";
import PromptModal from "@/components/PromptModal";
import CategoryColorModal from "@/components/CategoryColorModal";
import {
  ContentItem,
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
  // Initialize with INITIAL_BRIEF_DATA to ensure identical SSR and client initial hydration
  const [items, setItems] = useState<ContentItem[]>(INITIAL_BRIEF_DATA);

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
  const [isHargaExtractorOpen, setIsHargaExtractorOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [colorPickerCategory, setColorPickerCategory] = useState<string | null>(null);
  const [, setToneVersion] = useState(0);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real-time Firestore subscription with offline persistence & online sync
  useEffect(() => {
    let isMounted = true;

    // Restore local cache immediately on client mount without causing SSR hydration mismatch
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn("Error reading cold-start cache", e);
    }

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

  // Listen for category tone customization to trigger reactive UI updates
  useEffect(() => {
    const handleToneChange = () => setToneVersion((v) => v + 1);
    window.addEventListener("category_tone_change", handleToneChange);
    return () => window.removeEventListener("category_tone_change", handleToneChange);
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

  const priorityCount = useMemo(() => {
    return items.filter(i => Boolean(i.priority)).length;
  }, [items]);

  const pendingCount = items.length - executedCount;

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Sidebar filter
      if (activeSidebarView === "pending" && item.executed) return false;
      if (activeSidebarView === "executed" && !item.executed) return false;
      if (activeSidebarView === "priority" && !item.priority) return false;

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
    }).sort((a, b) => {
      // Urutan: 1. Prioritas, 2. Belum di eksekusi, 3. Sudah di eksekusi
      const rankA = a.executed ? 2 : (a.priority ? 0 : 1);
      const rankB = b.executed ? 2 : (b.priority ? 0 : 1);
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Konten terbaru (timestamp terbaru) ditaruh paling awal
      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      if (timeB !== timeA) {
        return timeB - timeA;
      }

      return (a.no || 0) - (b.no || 0);
    });
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

    const applyToggle = () => {
      updateItemsState((prev) => prev.map((i) => ((i.id && i.id === item.id) || i.no === item.no ? updated : i)));
      if (previewItem && ((previewItem.id && previewItem.id === item.id) || previewItem.no === item.no)) {
        setPreviewItem(updated);
      }
    };

    if (previewItem) {
      applyToggle();
    } else {
      runWithViewTransition(applyToggle);
    }

    // Save directly to Firestore (queued in IndexedDB if offline, auto-uploaded when online)
    saveContentToDb(updated).catch((err) => {
      console.warn("Firestore save error:", err);
    });
  };

  // Toggle priority status
  const handleTogglePriority = (item: ContentItem, explicitPriority?: boolean) => {
    const newPriority = typeof explicitPriority === "boolean" ? explicitPriority : !Boolean(item.priority);
    const now = new Date().toISOString();
    const updated: ContentItem = {
      ...item,
      priority: newPriority,
      updatedAt: now
    };

    const applyToggle = () => {
      updateItemsState((prev) => prev.map((i) => ((i.id && i.id === item.id) || i.no === item.no ? updated : i)));
      if (previewItem && ((previewItem.id && previewItem.id === item.id) || previewItem.no === item.no)) {
        setPreviewItem(updated);
      }
    };

    if (previewItem) {
      applyToggle();
    } else {
      runWithViewTransition(applyToggle);
    }

    // Save directly to Firestore
    saveContentToDb(updated).catch((err) => {
      console.warn("Firestore save priority error:", err);
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
    const existing = items.find((i) => (i.id && i.id === savedItem.id) || i.no === savedItem.no);
    const now = new Date().toISOString();
    const itemToSave: ContentItem = {
      ...savedItem,
      id: savedItem.id || `konten-${savedItem.no}`,
      createdAt: savedItem.createdAt || existing?.createdAt || now,
      updatedAt: now
    };

    updateItemsState((prev) => {
      const existingIndex = prev.findIndex((i) => (i.id && i.id === itemToSave.id) || i.no === itemToSave.no);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...itemToSave };
        return next;
      }
      return [itemToSave, ...prev];
    });

    if (previewItem && ((previewItem.id && previewItem.id === itemToSave.id) || previewItem.no === itemToSave.no)) {
      setPreviewItem(itemToSave);
    }

    await saveContentToDb(itemToSave);
  };

  const handleSaveBatch = async (batchItems: ContentItem[]) => {
    const now = new Date().toISOString();
    const enrichedBatch = batchItems.map((it) => ({
      ...it,
      createdAt: it.createdAt || now,
      updatedAt: it.updatedAt || now
    }));

    updateItemsState((prev) => {
      const itemMap = new Map<number, ContentItem>();
      // Enriched batch items first
      enrichedBatch.forEach((it) => itemMap.set(it.no, it));
      prev.forEach((it) => {
        if (!itemMap.has(it.no)) {
          itemMap.set(it.no, it);
        }
      });
      return Array.from(itemMap.values());
    });

    await seedContentsToDb(enrichedBatch);
  };

  const handleDeleteClick = (item: ContentItem) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const itemToDelete = deletingItem;
    setIsDeleting(true);

    updateItemsState((prev) =>
      prev.filter((i) => (i.id ? i.id !== itemToDelete.id : i.no !== itemToDelete.no))
    );
    setDeletingItem(null);
    setIsDeleting(false);

    const docId = itemToDelete.id || `konten-${itemToDelete.no}`;
    await deleteContentFromDb(docId);
  };

  const nextSuggestedNo = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.no)) + 1;
  }, [items]);

  const viewTitle = useMemo(() => {
    switch (activeSidebarView) {
      case "pending": return "Belum Eksekusi";
      case "priority": return "Prioritas";
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
        priorityCount={priorityCount}
        firebaseStatus={firebaseStatus}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        categories={categoriesWithCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenHargaExtractor={() => setIsHargaExtractorOpen(true)}
        onOpenPromptModal={() => setIsPromptModalOpen(true)}
        onOpenColorPicker={(category) => setColorPickerCategory(category)}
      />

      {/* Right Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white">

        {/* Top Header: Clean, purposeful, mobile-friendly touch targets */}
        <header className="min-h-[60px] sm:min-h-[62px] px-4 sm:px-8 py-2.5 border-b border-[#ECEBE8] flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0 bg-white">

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
            {/* <span className="text-xs text-gray-400 shrink-0">
              ({filteredItems.length})
            </span> */}
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
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">

            {/* View Mode Toggle ([|||] and [▦]) */}
            <div className="flex items-center p-1 bg-[#F0F0F2] rounded-xl border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 sm:p-1.5 min-w-[38px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "table" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
                  }`}
                title="Tampilan Tabel"
                aria-label="Tampilan Tabel"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 sm:p-1.5 min-w-[38px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
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
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-2 min-h-[40px] sm:min-h-[36px] rounded-xl text-xs font-semibold bg-[#1F6FB6] hover:bg-[#185A94] active:bg-[#185A94] text-white shadow-xs transition-colors select-none cursor-pointer w-full sm:w-auto"
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
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${activeSidebarView === "all"
                ? "bg-[#18181B] text-white"
                : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
                }`}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarView("pending")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${activeSidebarView === "pending"
                ? "bg-[#1F6FB6] text-white"
                : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
                }`}
            >
              Belum ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarView("priority")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${activeSidebarView === "priority"
                ? "bg-amber-500 text-white"
                : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
                }`}
            >
              Prioritas ({priorityCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarView("executed")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${activeSidebarView === "executed"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 pb-24">
              {filteredItems.map((item) => (
                <ContentCard
                  key={item.id || item.no}
                  item={item}
                  transitionPrefix="content-card"
                  onToggleExecuted={handleToggleExecuted}
                  onTogglePriority={handleTogglePriority}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                  onPreview={(it: ContentItem) => setPreviewItem(it)}
                  onOpen={(it: ContentItem) => setPreviewItem(it)}
                />
              ))}
            </div>
          ) : (
            <div className="pb-24">
              <ContentTable
                items={filteredItems}
                onToggleExecuted={handleToggleExecuted}
                onTogglePriority={handleTogglePriority}
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

      {isHargaExtractorOpen && (
        <HargaExtractorModal
          isOpen={isHargaExtractorOpen}
          onClose={() => setIsHargaExtractorOpen(false)}
        />
      )}

      {isPromptModalOpen && (
        <PromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          existingCategories={categoriesWithCounts.map(c => c.name)}
          nextSuggestedNo={nextSuggestedNo}
        />
      )}

      {colorPickerCategory && (
        <CategoryColorModal
          isOpen={Boolean(colorPickerCategory)}
          onClose={() => setColorPickerCategory(null)}
          categoryName={colorPickerCategory}
        />
      )}
    </div>
  );
}
