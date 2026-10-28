"use client";

import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import ContentCard from "@/components/ContentCard";
import ContentTable from "@/components/ContentTable";
import InstagramPreviewModal from "@/components/InstagramPreviewModal";
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
import { contentItemsToCSV } from "@/lib/csvHelper";
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  AlignJustify, 
  Plus, 
  ChevronLeft, 
  Download, 
  Menu, 
  X
} from "lucide-react";

const STORAGE_KEY = "semarang_cell_brief_contents_v2";

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>(INITIAL_BRIEF_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "offline" | "syncing">("offline");

  // View & Nav State
  const [activeSidebarView, setActiveSidebarView] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedPlatform, setSelectedPlatform] = useState("Semua");
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

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
      if (activeSidebarView === "shared" && !item.executed) return false;
      if (activeSidebarView === "favorites" && !item.judul.toLowerCase().includes("promo") && !item.kategori.toLowerCase().includes("promo")) {
        return false;
      }
      if (activeSidebarView === "notebooks" && (item.platform || "").includes("Reels")) {
        return false;
      }
      if (activeSidebarView === "projects" && !(item.platform || "").includes("Reels") && !(item.platform || "").includes("Carousel")) {
        return false;
      }

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

  // Exports
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `brief_konten_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const csvContent = contentItemsToCSV(items);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `brief_konten_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
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
      case "pending": return "Recent notes";
      case "shared": return "Shared";
      case "favorites": return "Favorites";
      case "tags": return "Tags";
      case "notebooks": return "Notebooks";
      case "projects": return "Projects";
      default: return "All notes";
    }
  }, [activeSidebarView]);

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-[#FAF9F6] text-[#18181B] font-sans">
      
      {/* Left Sidebar */}
      <Sidebar
        activeView={activeSidebarView}
        onSelectView={(v) => {
          setActiveSidebarView(v);
          if (v === "tags") {
            setIsFilterPopoverOpen(true);
          }
        }}
        totalCount={items.length}
        pendingCount={pendingCount}
        executedCount={executedCount}
        firebaseStatus={firebaseStatus}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Right Main Content View */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF9F6]">
        
        {/* Top Header Navigation: Clean, matches reference image exactly */}
        <header className="px-8 py-4.5 bg-white border-b border-[#ECEBE8] flex items-center justify-between gap-4 shrink-0">
          
          {/* Left: Breadcrumbs (< Home / All notes) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-[13.5px] select-none">
              <button 
                onClick={() => setActiveSidebarView("all")}
                className="flex items-center gap-1 text-[#71717A] hover:text-[#18181B] transition-colors font-medium cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
              <span className="text-[#D4D4D8] mx-1">/</span>
              <span className="text-[#18181B] font-bold">{viewTitle}</span>
            </div>
          </div>

          {/* Center: Search input */}
          <div className="relative flex-1 max-w-sm mx-4 hidden sm:block">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a note"
              className="w-full pl-10 pr-8 py-2.5 rounded-xl text-[13px] bg-[#F4F4F6] border border-transparent focus:border-[#D4D4D8] focus:bg-white text-[#18181B] placeholder-[#A1A1AA] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Tools: Filtres + [|||] [▦] + (+) Add */}
          <div className="flex items-center gap-3">
            
            {/* Filtres Button */}
            <button
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors select-none cursor-pointer ${
                selectedCategory !== "Semua" || selectedPlatform !== "Semua"
                  ? "bg-[#1F6FB6]/10 border-[#1F6FB6] text-[#1F6FB6] font-semibold"
                  : "bg-white border-[#E4E4E7] text-[#18181B] hover:bg-[#F4F4F5] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Filtres</span>
              {(selectedCategory !== "Semua" || selectedPlatform !== "Semua") && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1F6FB6]" />
              )}
            </button>

            {/* View Mode Toggle Capsule ([|||] and [▦]) */}
            <div className="flex items-center p-1 bg-[#F0F0F2] rounded-xl border border-[#E4E4E7]">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
                }`}
                title="Tampilan Tabel (|||)"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-[#18181B] shadow-2xs font-semibold" : "text-[#71717A] hover:text-[#18181B]"
                }`}
                title="Tampilan Kartu Pastel (▦)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={handleOpenCreate}
              className="p-2 rounded-xl bg-[#18181B] hover:bg-black text-white shadow-xs transition-colors select-none cursor-pointer"
              title="Tambah Konten Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Filter Popover Toolbar */}
        {isFilterPopoverOpen && (
          <div className="px-8 py-3.5 bg-white border-b border-[#ECEBE8] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[#71717A]">Kategori:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory("Semua")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === "Semua" ? "bg-[#18181B] text-white font-semibold" : "bg-[#F4F4F6] text-[#52525B] hover:bg-gray-200"
                  }`}
                >
                  Semua ({items.length})
                </button>
                {categoriesWithCounts.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === c.name ? "bg-[#18181B] text-white font-semibold" : "bg-[#F4F4F6] text-[#52525B] hover:bg-gray-200"
                    }`}
                  >
                    {c.name} ({c.count})
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-gray-200 hidden sm:block mx-1.5" />

              <span className="font-semibold text-[#71717A]">Format:</span>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-[#F4F4F6] border border-transparent rounded-lg px-3 py-1.5 text-xs text-[#18181B] focus:bg-white focus:outline-none"
              >
                <option value="Semua">Semua Format</option>
                <option value="Instagram Carousel">Instagram Carousel</option>
                <option value="Instagram Feed">Instagram Feed</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="Instagram Story">Instagram Story</option>
              </select>

              {(selectedCategory !== "Semua" || selectedPlatform !== "Semua") && (
                <button
                  onClick={() => {
                    setSelectedCategory("Semua");
                    setSelectedPlatform("Semua");
                  }}
                  className="text-rose-600 hover:underline font-medium"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Quick Export options inside Filter toolbar */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Unduh CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Unduh JSON</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Body with Generous Padding */}
        <div className="flex-1 overflow-y-auto px-8 py-8 sm:px-10 sm:py-9">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🔍
              </div>
              <h3 className="text-sm font-bold text-[#18181B] mb-1.5">
                Tidak ada catatan ditemukan
              </h3>
              <p className="text-xs max-w-sm text-[#71717A] mb-5">
                Ubah kata kunci pencarian atau reset filter untuk menampilkan catatan brief kembali.
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
                Tampilkan Semua Catatan
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* 2 or 3 Columns Pastel Cards Grid matching the Reference Screenshot */
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-7 max-w-[1400px] mx-auto pb-24">
              {filteredItems.map((item) => (
                <ContentCard
                  key={item.id || item.no}
                  item={item}
                  onToggleExecuted={handleToggleExecuted}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                  onPreview={(it) => setPreviewItem(it)}
                  onAddContent={handleOpenCreate}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="max-w-[1400px] mx-auto pb-24">
              <ContentTable
                items={filteredItems}
                onToggleExecuted={handleToggleExecuted}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteClick}
                onPreview={(it) => setPreviewItem(it)}
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
        <InstagramPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onToggleExecuted={handleToggleExecuted}
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
