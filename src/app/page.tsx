"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import StatsCards from "@/components/StatsCards";
import FilterBar from "@/components/FilterBar";
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
import { Sparkles, Plus, Smartphone, Layers, AlertCircle } from "lucide-react";

const STORAGE_KEY = "semarang_cell_brief_contents_v1";

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>(INITIAL_BRIEF_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "offline" | "syncing">("offline");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedPlatform, setSelectedPlatform] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [sortBy, setSortBy] = useState<"no-asc" | "no-desc" | "title-asc">("no-asc");
  const [viewMode, setViewMode] = useState<"grid" | "table" | "preview">("grid");

  // Modal states
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 1. Initial Load from LocalStorage + Background Firestore Sync Check
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

    // Check Firestore
    checkFirestore();
  }, []);

  const checkFirestore = async () => {
    try {
      const health = await checkFirestoreHealth();
      if (health.ok) {
        setFirebaseStatus("connected");
        // If Firestore has data, we can optionally fetch
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

  // 2. Persist to localStorage whenever items change
  const updateItemsState = (newItems: ContentItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn("Could not write to local cache", e);
    }
  };

  // 3. Category List with counts
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

  const uniqueCategoryNames = useMemo(() => {
    return categoriesWithCounts.map(c => c.name);
  }, [categoriesWithCounts]);

  // 4. Filtering and Sorting logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.judul.toLowerCase().includes(q);
        const matchCopy = item.copywriting.toLowerCase().includes(q);
        const matchAmbience = item.ambience.toLowerCase().includes(q);
        const matchCaption = item.caption.toLowerCase().includes(q);
        const matchNo = item.no.toString().includes(q);
        if (!matchTitle && !matchCopy && !matchAmbience && !matchCaption && !matchNo) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== "Semua" && item.kategori !== selectedCategory) {
        return false;
      }

      // Platform
      if (selectedPlatform !== "Semua" && (item.platform || "Instagram Feed") !== selectedPlatform) {
        return false;
      }

      // Status
      if (selectedStatus !== "Semua" && (item.status || "Siap Tayang") !== selectedStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "no-asc") return a.no - b.no;
      if (sortBy === "no-desc") return b.no - a.no;
      if (sortBy === "title-asc") return a.judul.localeCompare(b.judul);
      return 0;
    });
  }, [items, searchQuery, selectedCategory, selectedPlatform, selectedStatus, sortBy]);

  // 5. CRUD Handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsContentModalOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
    setEditingItem(item);
    setIsContentModalOpen(true);
  };

  const handleSaveContent = async (savedItem: ContentItem) => {
    let nextList: ContentItem[];
    const existingIndex = items.findIndex(i => (i.id && i.id === savedItem.id) || i.no === savedItem.no);

    if (existingIndex >= 0) {
      nextList = [...items];
      nextList[existingIndex] = { ...savedItem };
    } else {
      nextList = [savedItem, ...items];
    }

    updateItemsState(nextList);

    // Save to Firestore in background if available
    try {
      await saveContentToDb(savedItem);
      setFirebaseStatus("connected");
    } catch (err) {
      console.warn("Could not save to Firestore, kept in local cache:", err);
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

  const handleStatusChange = async (item: ContentItem, newStatus: ContentItem["status"]) => {
    const updated = { ...item, status: newStatus };
    const nextList = items.map(i => (i.no === item.no ? updated : i));
    updateItemsState(nextList);

    try {
      await saveContentToDb(updated);
    } catch (e) {
      // offline fallback
    }
  };

  // 6. Sync Handlers
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

  // 7. Export JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `brief_semarang_cell_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const nextSuggestedNo = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.no)) + 1;
  }, [items]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "Semua" || selectedPlatform !== "Semua" || selectedStatus !== "Semua";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      {/* Top Navigation */}
      <Navbar
        firebaseStatus={firebaseStatus}
        totalCount={items.length}
        onOpenCreate={handleOpenCreate}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onExport={handleExportJSON}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* KPI Stats Bar */}
        <StatsCards
          items={items}
          activeFilterStatus={selectedStatus}
          onFilterStatus={(status) => setSelectedStatus(status)}
        />

        {/* Filter & View Switcher Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categoriesWithCounts}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onResetFilters={() => {
            setSearchQuery("");
            setSelectedCategory("Semua");
            setSelectedPlatform("Semua");
            setSelectedStatus("Semua");
          }}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Content Listing Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{filteredItems.length}</span> dari {items.length} ide konten
            {hasActiveFilters && " (difilter)"}
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Semarang Cell Metro • Primary #1F6FB6
          </div>
        </div>

        {/* Content Display based on View Mode */}
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1F6FB6] flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Tidak ada ide konten yang cocok
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau reset filter kategori untuk melihat kembali seluruh materi brief.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua");
                setSelectedPlatform("Semua");
                setSelectedStatus("Semua");
              }}
              className="btn-secondary text-xs py-2 px-4"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredItems.map((item) => (
              <ContentCard
                key={item.id || item.no}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteClick}
                onPreview={(it) => setPreviewItem(it)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : viewMode === "table" ? (
          <ContentTable
            items={filteredItems}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteClick}
            onPreview={(it) => setPreviewItem(it)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          /* Instagram Simulator Feed View */
          <div className="space-y-6 max-w-md mx-auto">
            <div className="bg-blue-50 border border-blue-200 text-[#1F6FB6] p-3 rounded-xl text-xs text-center font-medium">
              Mode Simulator Feed Instagram (Menampilkan {filteredItems.length} postingan)
            </div>
            {filteredItems.slice(0, 15).map((item) => (
              <div key={item.id || item.no} className="phone-mockup">
                {/* Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-[#1F6FB6] p-[2px]">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[10px] text-[#1F6FB6]">
                        ESC
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        eldoradosemarangcell
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Metro Barat, Kota Metro
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    #{item.no}
                  </span>
                </div>

                {/* Canvas Post */}
                <div className="ig-canvas-post">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs text-white">
                      {item.kategori}
                    </span>
                    <span className="text-[10px] font-mono text-white/80">
                      Eldorado
                    </span>
                  </div>

                  <div className="my-auto py-2">
                    <h3 className="text-sm font-extrabold text-amber-300 mb-1.5 uppercase tracking-wide">
                      {item.judul}
                    </h3>
                    <p className="text-xs font-mono text-white/95 whitespace-pre-wrap leading-relaxed drop-shadow-xs">
                      {item.copywriting}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-white/80">
                    <span>Eldorado Semarang Cell</span>
                    <span>Swipe ➔</span>
                  </div>
                </div>

                {/* Caption preview */}
                <div className="p-3 text-xs text-slate-800 border-t border-slate-100">
                  <p className="whitespace-pre-line leading-relaxed text-[11px]">
                    <span className="font-bold mr-1">eldoradosemarangcell</span>
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © 2026 <span className="font-semibold text-slate-700">Eldorado Semarang Cell</span> • Sistem Manajemen Konten Media Sosial
          </p>
          <p className="text-slate-400">
            Jl. Soekarno Hatta No 43 Metro Barat, Kota Metro • WA: 088272202241
          </p>
        </div>
      </footer>

      {/* Modals */}
      <InstagramPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      <ContentModal
        isOpen={isContentModalOpen}
        item={editingItem}
        onClose={() => {
          setIsContentModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveContent}
        existingCategories={uniqueCategoryNames}
        nextSuggestedNo={nextSuggestedNo}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <FirebaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        firebaseStatus={firebaseStatus}
        onPushToFirebase={handlePushToFirebase}
        onPullFromFirebase={handlePullFromFirebase}
        onResetToDefault={handleResetToDefault}
        localCount={items.length}
      />
    </div>
  );
}
