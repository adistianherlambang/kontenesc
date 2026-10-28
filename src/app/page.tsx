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
  X,
  Sparkles,
  Smartphone
} from "lucide-react";

const STORAGE_KEY = "semarang_cell_brief_contents_v2";

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>(INITIAL_BRIEF_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "offline" | "syncing">("offline");

  // Navigation & View Mode
  const [activeSidebarView, setActiveSidebarView] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table" | "simulator">("grid");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedPlatform, setSelectedPlatform] = useState("Semua");
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Modals
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 1. Initial Load from LocalStorage + Firestore check
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

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Sidebar Navigation filter
      if (activeSidebarView === "pending" && item.executed) return false;
      if (activeSidebarView === "executed" && !item.executed) return false;
      if (activeSidebarView === "favorites" && !item.judul.toLowerCase().includes("promo") && !item.kategori.toLowerCase().includes("promo")) {
        return false;
      }
      if (activeSidebarView === "feed" && (item.platform || "").includes("Reels")) {
        return false;
      }
      if (activeSidebarView === "reels" && !(item.platform || "").includes("Reels") && !(item.platform || "").includes("Carousel")) {
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

  // Handlers
  const handleToggleExecuted = async (item: ContentItem) => {
    const newExecuted = !Boolean(item.executed);
    const updated = { ...item, executed: newExecuted, updatedAt: new Date().toISOString() };
    const nextList = items.map(i => (i.no === item.no ? updated : i));
    updateItemsState(nextList);

    try {
      await saveContentToDb(updated);
    } catch (e) {
      // Local first fallback
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
    downloadAnchor.setAttribute("download", `brief_konten_semarang_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsExportMenuOpen(false);
  };

  const handleExportCSV = () => {
    const csvContent = contentItemsToCSV(items);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `brief_konten_semarang_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
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
      case "pending": return "Recent notes (Belum Eksekusi)";
      case "executed": return "Shared (Sudah Eksekusi)";
      case "favorites": return "Favorites (Prioritas Promo)";
      case "tags": return "Tags (Kategori Produk)";
      case "feed": return "Notebooks (Instagram Feed)";
      case "reels": return "Projects (Reels & Carousel)";
      default: return "All notes";
    }
  }, [activeSidebarView]);

  return (
    <div className="min-h-screen p-2 sm:p-5 lg:p-7 flex items-center justify-center">
      
      {/* Floating macOS Window Container */}
      <div className="
        w-full max-w-[1460px] min-h-[92vh] max-h-[96vh]
        bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[32px]
        border border-white/80 shadow-[0_25px_70px_rgba(0,0,0,0.14)]
        flex flex-col md:flex-row overflow-hidden
      ">
        
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FCFBFA] md:rounded-r-[32px] overflow-hidden">
          
          {/* Top Header Navigation (Breadcrumb + Search + Filtres + View Mode + Add) */}
          <header className="px-4 sm:px-6 py-3.5 border-b border-[#EAE9E4] bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            
            {/* Left: Mobile Toggle + Breadcrumb */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 select-none">
                <button 
                  onClick={() => setActiveSidebarView("all")}
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-bold">{viewTitle}</span>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="relative flex-1 max-w-sm sm:mx-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a note..."
                className="w-full pl-9 pr-7 py-1.5 rounded-xl text-xs bg-[#F4F4F6] border border-transparent focus:border-gray-200 focus:bg-white text-gray-800 placeholder-gray-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 justify-end relative">
              
              {/* Filtres Button */}
              <button
                onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors select-none ${
                  selectedCategory !== "Semua" || selectedPlatform !== "Semua"
                    ? "bg-[#1F6FB6]/10 border-[#1F6FB6] text-[#1F6FB6] font-semibold"
                    : "bg-white border-[#E0DED9] text-gray-700 hover:bg-gray-50 shadow-2xs"
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span>Filtres</span>
                {(selectedCategory !== "Semua" || selectedPlatform !== "Semua") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F6FB6]" />
                )}
              </button>

              {/* View Mode Toggle (||| vs ▦) */}
              <div className="flex items-center p-0.5 bg-[#F0EFEA] rounded-xl border border-[#E0DED9]">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === "table" ? "bg-white text-gray-900 shadow-2xs font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="List / Table View (|||)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === "grid" ? "bg-white text-gray-900 shadow-2xs font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Grid / Cards View (▦)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("simulator")}
                  className={`p-1.5 rounded-lg text-xs transition-colors hidden sm:block ${
                    viewMode === "simulator" ? "bg-white text-gray-900 shadow-2xs font-semibold" : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Instagram Feed Simulator"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Content Button */}
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1F6FB6] hover:bg-[#185A94] text-white shadow-xs transition-colors select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="p-1.5 rounded-xl border border-[#E0DED9] bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-2xs"
                  title="Ekspor Data"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30">
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Format CSV</span>
                      <span className="text-[10px] text-gray-400">.csv</span>
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Format JSON</span>
                      <span className="text-[10px] text-gray-400">.json</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Filter Popover Panel (when Filtres is active) */}
          {isFilterPopoverOpen && (
            <div className="px-6 py-3 bg-[#F7F6F3] border-b border-[#EAE9E4] flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-gray-500">Kategori:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedCategory("Semua")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === "Semua" ? "bg-gray-900 text-white font-semibold" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Semua ({items.length})
                </button>
                {categoriesWithCounts.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === c.name ? "bg-gray-900 text-white font-semibold" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {c.name} ({c.count})
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-gray-300 hidden sm:block mx-1" />

              <span className="font-semibold text-gray-500">Format:</span>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 focus:outline-none"
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
                  className="text-rose-600 hover:underline ml-auto font-medium"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}

          {/* Main Body: Scrollable Content List */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl mb-3">
                  🔍
                </div>
                <h3 className="text-sm font-bold text-gray-700 mb-1">
                  Tidak ada konten ditemukan
                </h3>
                <p className="text-xs max-w-sm text-gray-500 mb-4">
                  Cobalah ubah kata kunci pencarian atau reset filter untuk menampilkan catatan brief kembali.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Semua");
                    setSelectedPlatform("Semua");
                    setActiveSidebarView("all");
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800"
                >
                  Tampilkan Semua Catatan
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Pastel Cards Grid matching the Reference Screenshot */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
                {filteredItems.map((item) => (
                  <ContentCard
                    key={item.id || item.no}
                    item={item}
                    onToggleExecuted={handleToggleExecuted}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteClick}
                    onPreview={(it) => setPreviewItem(it)}
                  />
                ))}
              </div>
            ) : viewMode === "table" ? (
              /* Notion Table View */
              <div className="pb-12">
                <ContentTable
                  items={filteredItems}
                  onToggleExecuted={handleToggleExecuted}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                  onPreview={(it) => setPreviewItem(it)}
                />
              </div>
            ) : (
              /* Instagram Simulator */
              <div className="max-w-md mx-auto space-y-6 pb-12">
                <div className="bg-[#EEF4FF] text-[#1F6FB6] p-3 rounded-2xl border border-[#D8E6FD] text-xs text-center font-semibold">
                  📱 Instagram Feed Mockup ({filteredItems.length} konten)
                </div>
                {filteredItems.slice(0, 15).map((item) => (
                  <div key={item.id || item.no} className="ig-phone-preview bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-3 flex items-center justify-between border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1F6FB6] text-white flex items-center justify-center font-bold text-[10px]">
                          ESC
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 leading-none">eldoradosemarangcell</h4>
                          <span className="text-[10px] text-gray-400">Metro Barat, Kota Metro</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-gray-400">#{item.no}</span>
                    </div>

                    <div className="ig-canvas-post p-5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-white w-max">
                        {item.kategori}
                      </span>
                      <h3 className="text-lg font-black text-white leading-tight">
                        {item.judul}
                      </h3>
                      <div className="text-xs text-white/90 font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-hidden">
                        {item.copywriting}
                      </div>
                      <div className="text-[11px] text-white/70 italic mt-2">
                        💡 {item.ambience}
                      </div>
                    </div>

                    <div className="p-3 bg-white text-xs">
                      <p className="text-gray-800 line-clamp-3 leading-relaxed">
                        <strong className="mr-1 text-gray-900">eldoradosemarangcell</strong>
                        {item.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

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

