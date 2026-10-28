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

const STORAGE_KEY = "semarang_cell_brief_contents_v2";

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
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read local cache", e);
    }
    setIsLoaded(true);

    checkFirestore();
  }, []);

  const checkFirestore = async () => {
    try {
      const health = await checkFirestoreHealth();
      if (health.ok) {
        setFirebaseStatus("connected");
        if (health.count && health.count > 0) {
          const remoteItems = await getContentsFromDb();
          if (remoteItems.length > 0) {
            setItems(remoteItems);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteItems));
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
  const handleToggleExecuted = async (item: ContentItem) => {
    const newExecuted = !Boolean(item.executed);
    const updated = { ...item, executed: newExecuted, updatedAt: new Date().toISOString() };
    const nextList = items.map(i => (i.no === item.no ? updated : i));
    updateItemsState(nextList);

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
    let nextList: ContentItem[];
    const existingIndex = items.findIndex(i => (i.id && i.id === savedItem.id) || i.no === savedItem.no);

    if (existingIndex >= 0) {
      nextList = [...items];
      nextList[existingIndex] = { ...savedItem };
    } else {
      nextList = [...items, savedItem];
    }

    updateItemsState(nextList);

    try {
      await saveContentToDb(savedItem);
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
      updateItemsState(remote);
    }
    setFirebaseStatus("connected");
  };

  const handleResetToDefault = () => {
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
    <div className="h-screen w-screen overflow-hidden flex bg-white text-[#18181B] font-sans">
      
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
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* Top Header: Clean, purposeful */}
        <header className="h-[54px] px-8 border-b border-[#ECEBE8] flex items-center justify-between gap-4 shrink-0 bg-white">
          
          {/* Left Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-[#18181B]">
              {viewTitle}
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              ({filteredItems.length})
            </span>
          </div>

          {/* Center Search Input */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari konten, judul, topik..."
              className="w-full pl-9 pr-7 py-1.5 rounded-xl text-xs bg-[#F4F4F6] border border-transparent focus:border-[#D4D4D8] focus:bg-white text-[#18181B] placeholder-[#A1A1AA] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Actions: View switch & Tambah Konten */}
          <div className="flex items-center gap-3">
            
            {/* View Mode Toggle ([|||] and [▦]) */}
            <div className="flex items-center p-0.5 bg-[#F0F0F2] rounded-xl border border-[#E4E4E7]">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
                }`}
                title="Tampilan Tabel"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tambah Konten (Manual, Batch CSV, Batch JSON) */}
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1F6FB6] hover:bg-[#185A94] text-white shadow-xs transition-colors select-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Konten</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-400">
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
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                  setSelectedPlatform("Semua");
                  setActiveSidebarView("all");
                }}
                className="px-5 py-2 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-black cursor-pointer"
              >
                Tampilkan Semua Konten
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
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
