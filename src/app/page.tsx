"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
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
import { contentItemsToCSV } from "@/lib/csvHelper";
import { Plus, CheckSquare, Clock, Smartphone, Table, LayoutGrid, FileText } from "lucide-react";

const STORAGE_KEY = "semarang_cell_brief_contents_v2";

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>(INITIAL_BRIEF_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"connected" | "offline" | "syncing">("offline");

  // Tab & Filter states
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "executed" | "gallery" | "simulator">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedPlatform, setSelectedPlatform] = useState("Semua");
  const [sortBy, setSortBy] = useState<"no-asc" | "no-desc" | "title-asc">("no-asc");

  // Modal states
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 1. Initial Load from LocalStorage + Cloud Firestore Check
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

  // 2. Persist to localStorage
  const updateItemsState = (newItems: ContentItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn("Could not write to local cache", e);
    }
  };

  // 3. Category count aggregation
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

  const executedCount = useMemo(() => {
    return items.filter(i => Boolean(i.executed)).length;
  }, [items]);

  const pendingCount = items.length - executedCount;

  // 4. Filtering and Sorting logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "pending" && item.executed) return false;
      if (activeTab === "executed" && !item.executed) return false;

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

      return true;
    }).sort((a, b) => {
      if (sortBy === "no-asc") return a.no - b.no;
      if (sortBy === "no-desc") return b.no - a.no;
      if (sortBy === "title-asc") return a.judul.localeCompare(b.judul);
      return 0;
    });
  }, [items, activeTab, searchQuery, selectedCategory, selectedPlatform, sortBy]);

  // 5. Toggle Checkbox Execution Status (Core Notion Action)
  const handleToggleExecuted = async (item: ContentItem) => {
    const newExecuted = !Boolean(item.executed);
    const updated = { ...item, executed: newExecuted, updatedAt: new Date().toISOString() };
    const nextList = items.map(i => (i.no === item.no ? updated : i));
    updateItemsState(nextList);

    try {
      await saveContentToDb(updated);
    } catch (e) {
      // silent local fallback
    }
  };

  // 6. CRUD Handlers
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
      console.warn("Could not save to Firestore:", err);
    }
  };

  // 7. Batch Save Handler (CSV or JSON)
  const handleSaveBatch = async (batchItems: ContentItem[]) => {
    // Avoid duplicate numbers: if item number already exists, update it, otherwise append
    const itemMap = new Map<number, ContentItem>();
    items.forEach(it => itemMap.set(it.no, it));
    batchItems.forEach(it => itemMap.set(it.no, it));

    const nextList = Array.from(itemMap.values()).sort((a, b) => a.no - b.no);
    updateItemsState(nextList);

    try {
      await seedContentsToDb(nextList);
      setFirebaseStatus("connected");
    } catch (e) {
      console.warn("Batch sync error:", e);
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

  // 8. Sync Handlers
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

  // 9. Export Functions
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `brief_konten_semarang_${new Date().toISOString().split("T")[0]}.json`);
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
    downloadAnchor.setAttribute("download", `brief_konten_semarang_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const nextSuggestedNo = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(...items.map(i => i.no)) + 1;
  }, [items]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "Semua" || selectedPlatform !== "Semua";

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#37352F]">
      {/* Top Navigation */}
      <Navbar
        firebaseStatus={firebaseStatus}
        totalCount={items.length}
        executedCount={executedCount}
        onOpenCreate={handleOpenCreate}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
      />

      {/* Main Notion Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-5">
        
        {/* Notion Header Banner */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl select-none">📱</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#37352F]">
              Manajemen Konten Semarang Cell
            </h1>
          </div>
          <p className="text-xs text-[#787774] max-w-2xl leading-relaxed">
            Database 60 brief konten pemasaran Instagram. Centang checkbox untuk menandai konten yang telah dieksekusi atau dipublikasikan.
          </p>
        </div>

        {/* Database View Tabs & Filter Toolbar */}
        <FilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={items.length}
          pendingCount={pendingCount}
          executedCount={executedCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categoriesWithCounts}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={() => {
            setSearchQuery("");
            setSelectedCategory("Semua");
            setSelectedPlatform("Semua");
          }}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Views Rendering */}
        {filteredItems.length === 0 ? (
          <div className="border border-[#E9E9E7] rounded-lg p-10 text-center bg-[#F7F6F3] text-xs text-[#787774]">
            <p className="font-medium text-[#37352F] mb-1">Tidak ada konten yang sesuai filter</p>
            <p className="mb-3">Ubah kata kunci pencarian atau reset filter untuk menampilkan kembali data.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Semua");
                setSelectedPlatform("Semua");
                setActiveTab("all");
              }}
              className="notion-btn notion-btn-bordered text-xs"
            >
              Tampilkan Semua Konten
            </button>
          </div>
        ) : activeTab === "gallery" ? (
          /* Notion Gallery View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
        ) : activeTab === "simulator" ? (
          /* Instagram Mobile Feed Simulator View */
          <div className="space-y-6 max-w-sm mx-auto">
            <div className="bg-[#E8F3FA] text-[#1F6FB6] p-2.5 rounded border border-[#BCD8F0] text-xs text-center font-medium">
              Simulator Feed Instagram ({filteredItems.length} konten)
            </div>
            {filteredItems.slice(0, 20).map((item) => (
              <div key={item.id || item.no} className="ig-phone-preview">
                <div className="p-3 flex items-center justify-between border-b border-[#E9E9E7]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1F6FB6] text-white flex items-center justify-center font-bold text-[9px]">
                      ESC
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-900 leading-none">eldoradosemarangcell</h4>
                      <span className="text-[9px] text-slate-500">Metro Barat, Kota Metro</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">#{item.no}</span>
                </div>

                <div className="ig-canvas-post p-4">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/20 text-white w-max">
                    {item.kategori}
                  </span>
                  <div className="my-auto py-2">
                    <h3 className="text-xs font-bold text-amber-300 mb-1 uppercase">{item.judul}</h3>
                    <p className="text-[11px] font-mono text-white/95 whitespace-pre-wrap">{item.copywriting}</p>
                  </div>
                  <div className="pt-1.5 border-t border-white/20 flex justify-between text-[9px] text-white/80">
                    <span>Eldorado Semarang Cell</span>
                    <span>Swipe ➔</span>
                  </div>
                </div>

                <div className="p-3 text-[11px] text-slate-800">
                  <span className="font-bold mr-1">eldoradosemarangcell</span>
                  <span className="whitespace-pre-line text-slate-700">{item.caption}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Notion Database Table View (Default for "all", "pending", "executed") */
          <ContentTable
            items={filteredItems}
            onToggleExecuted={handleToggleExecuted}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteClick}
            onPreview={(it) => setPreviewItem(it)}
          />
        )}

        {/* Bottom Status Count */}
        <div className="mt-3 flex items-center justify-between text-xs text-[#9B9A97] px-1">
          <span>Menampilkan {filteredItems.length} dari {items.length} konten</span>
          <span>Eldorado Semarang Cell • Metro Barat</span>
        </div>
      </main>

      {/* Modals */}
      <InstagramPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onToggleExecuted={handleToggleExecuted}
      />

      <ContentModal
        isOpen={isContentModalOpen}
        item={editingItem}
        onClose={() => {
          setIsContentModalOpen(false);
          setEditingItem(null);
        }}
        onSaveSingle={handleSaveSingle}
        onSaveBatch={handleSaveBatch}
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
