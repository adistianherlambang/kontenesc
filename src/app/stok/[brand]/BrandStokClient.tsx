"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  X,
  LayoutGrid,
  AlignJustify,
  Menu,
} from "lucide-react";
import {
  StokItem,
  StokSummary,
  subscribeToStok,
  getStokFromDb,
} from "@/lib/firebase";
import { BrandLogo, getBrandConfig } from "@/lib/brandLogos";
import StokSidebar from "@/components/StokSidebar";
import StokItemList from "@/components/StokItemList";
import SortSelect, { StokSortOption } from "@/components/SortSelect";
import StoreSecurityGate from "@/components/StoreSecurityGate";

export default function BrandStokClient({ brand }: { brand: string }) {
  const rawBrandSlug = (brand || "").toLowerCase();
  const brandConfig = getBrandConfig(rawBrandSlug);

  const [items, setItems] = useState<StokItem[]>([]);
  const [summary, setSummary] = useState<StokSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<
    "connected" | "offline" | "syncing"
  >("offline");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<StokSortOption>("name-asc");

  useEffect(() => {
    const handleOnline = () => {
      setFirebaseStatus((prev) => (prev === "offline" ? "syncing" : prev));
    };
    const handleOffline = () => setFirebaseStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    getStokFromDb().then(({ items: initItems, summary: initSummary }) => {
      if (initItems.length > 0) {
        setItems(initItems);
        setSummary(initSummary);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToStok(
      ({ items: newItems, summary: newSummary }) => {
        setItems(newItems);
        setSummary(newSummary);
        setIsLoading(false);
        setFirebaseStatus(
          typeof window !== "undefined" && !window.navigator.onLine
            ? "offline"
            : "connected"
        );
      },
      () => {
        if (typeof window !== "undefined" && !window.navigator.onLine) {
          setFirebaseStatus("offline");
        }
      }
    );

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsub();
    };
  }, []);

  const brandTotals = useMemo(() => {
    if (summary?.brand_totals) {
      return summary.brand_totals;
    }
    const map: Record<string, number> = {};
    items.forEach((it) => {
      const b = it.brand || "Lainnya";
      map[b] = (map[b] || 0) + (it.total_stok || 0);
    });
    return map;
  }, [summary, items]);

  const totalUnits = useMemo(() => {
    if (summary?.total_units) return summary.total_units;
    return items.reduce((acc, it) => acc + (it.total_stok || 0), 0);
  }, [summary, items]);

  const tanggal = summary?.tanggal || items[0]?.tanggal || "";

  const brandItems = useMemo(() => {
    const list = items.filter((it) => {
      const itBrand = (it.brand || "").trim().toLowerCase();
      return (
        itBrand === rawBrandSlug ||
        itBrand === brandConfig.name.toLowerCase()
      );
    });

    return list.sort((a, b) => {
      if (sortBy === "stok-desc") {
        return (b.total_stok || 0) - (a.total_stok || 0);
      }
      if (sortBy === "stok-asc") {
        return (a.total_stok || 0) - (b.total_stok || 0);
      }
      // default: natural alphanumeric A-Z
      return a.tipe.localeCompare(b.tipe, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [items, rawBrandSlug, brandConfig.name, sortBy]);

  const brandTotalUnits = useMemo(() => {
    return brandItems.reduce((acc, it) => acc + (it.total_stok || 0), 0);
  }, [brandItems]);

  const filteredBrandItems = useMemo(() => {
    if (!searchQuery.trim()) return brandItems;
    const q = searchQuery.toLowerCase().trim();
    return brandItems.filter((it) => {
      const matchTipe = it.tipe.toLowerCase().includes(q);
      const matchWarna = it.rincian_warna?.some((w) =>
        w.warna.toLowerCase().includes(q)
      );
      return matchTipe || matchWarna;
    });
  }, [brandItems, searchQuery]);

  return (
    <StoreSecurityGate pageTitle={`Stok ${brandConfig.name}`}>
      <div className="h-dvh w-full overflow-hidden flex bg-white text-[#18181B] font-sans">
        <StokSidebar
          activeBrand={rawBrandSlug}
          brandTotals={brandTotals}
          totalUnits={totalUnits}
          tanggal={tanggal}
          firebaseStatus={firebaseStatus}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white">
        {/* Responsive Header */}
        <header className="px-3 sm:px-6 py-3 border-b border-[#ECEBE8] flex flex-col gap-2.5 shrink-0 bg-white">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Back Button + Brand Logo + Count */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/stok"
                className="btn btn-ghost btn-icon -ml-2"
                title="Kembali ke Semua Brand"
                aria-label="Kembali ke Semua Brand"
              >
                <ArrowLeft className="size-4.5" />
              </Link>

              <div className="flex items-center gap-2">
                <BrandLogo
                  brand={rawBrandSlug}
                  color={rawBrandSlug === "infinix" ? "#2E9E00" : undefined}
                  className="h-4 sm:h-4.5 w-auto"
                />
              </div>
            </div>

            {/* Desktop Center Search */}
            <div className="relative flex-1 max-w-sm hidden sm:block">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari tipe atau warna di ${brandConfig.name}...`}
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

            {/* Right: Sort, View Mode Toggle & Mobile Menu */}
            <div className="flex items-center gap-2 shrink-0">
              {/* <SortSelect
                value={sortBy}
                onChange={setSortBy}
                className="hidden sm:inline-block"
              /> */}

              <div className="flex items-center p-1 bg-[#F0F0F2] rounded-xl border border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "grid"
                    ? "bg-white text-[#18181B] shadow-2xs font-semibold"
                    : "text-[#71717A] hover:text-[#18181B]"
                    }`}
                  title="Tampilan Kartu"
                  aria-label="Tampilan Kartu"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "table"
                    ? "bg-white text-[#18181B] shadow-2xs font-semibold"
                    : "text-[#71717A] hover:text-[#18181B]"
                    }`}
                  title="Tampilan Tabel"
                  aria-label="Tampilan Tabel"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Buka menu navigasi"
                className="btn btn-ghost btn-icon md:hidden"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>

          {/* Mobile Search & Sort Row */}
          <div className="flex items-center gap-2 w-full sm:hidden">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari tipe/warna ${brandConfig.name}...`}
                className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-[#F4F4F6] border border-transparent focus:border-[#D4D4D8] focus:bg-white text-[#18181B] placeholder-[#A1A1AA] outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <SortSelect
              value={sortBy}
              onChange={setSortBy}
              className="shrink-0"
            />
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          <StokItemList
            items={filteredBrandItems}
            viewMode={viewMode}
            isLoading={isLoading}
            emptyMessage={
              searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : `Belum ada data stok ${brandConfig.name}`
            }
            onResetSearch={searchQuery ? () => setSearchQuery("") : undefined}
          />
        </div>
      </main>
    </div>
  </StoreSecurityGate>
  );
}
