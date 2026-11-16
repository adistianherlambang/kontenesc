"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Menu, Search, X, LayoutGrid, AlignJustify } from "lucide-react";
import {
  StokItem,
  StokSummary,
  subscribeToStok,
  getStokFromDb,
} from "@/lib/firebase";
import { BrandLogo, BRAND_LIST, getBrandConfig } from "@/lib/brandLogos";
import StokSidebar from "@/components/StokSidebar";
import StokItemList from "@/components/StokItemList";

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
    return items.filter((it) => {
      const itBrand = (it.brand || "").trim().toLowerCase();
      return (
        itBrand === rawBrandSlug ||
        itBrand === brandConfig.name.toLowerCase()
      );
    });
  }, [items, rawBrandSlug, brandConfig.name]);

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
        {/* Top Header — matches /konten */}
        <header className="min-h-[60px] sm:min-h-[62px] px-4 sm:px-8 py-2.5 border-b border-[#ECEBE8] flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="md:hidden -ml-1 p-2.5 min-w-[42px] min-h-[42px] flex items-center justify-center text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <BrandLogo
              brand={rawBrandSlug}
              color={rawBrandSlug === "infinix" ? "#2E9E00" : undefined}
              className="h-4 w-auto"
            />
            <span className="text-xs text-[#71717A] shrink-0">
              &middot; {brandTotalUnits} unit
            </span>
          </div>

          {/* Center Search Input (Desktop) */}
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

          {/* Right Actions: View switch */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center p-1 bg-[#F0F0F2] rounded-xl border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 sm:p-1.5 min-w-[38px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-[#18181B] shadow-2xs font-semibold"
                    : "text-[#71717A] hover:text-[#18181B]"
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
                  viewMode === "grid"
                    ? "bg-white text-[#18181B] shadow-2xs font-semibold"
                    : "text-[#71717A] hover:text-[#18181B]"
                }`}
                title="Tampilan Kartu"
                aria-label="Tampilan Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Search Input Row */}
          <div className="relative w-full sm:hidden">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari tipe di ${brandConfig.name}...`}
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

          {/* Mobile Quick Brand Switcher Pills — matches /konten mobile filter bar */}
          <div className="flex items-center gap-1.5 w-full md:hidden overflow-x-auto pb-0.5">
            <Link
              href="/stok"
              className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-[#F4F4F6] text-[#71717A] flex items-center"
            >
              Semua
            </Link>
            {BRAND_LIST.map(({ slug, name }) => {
              const active = slug === rawBrandSlug;
              return (
                <Link
                  key={slug}
                  href={`/stok/${slug}`}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center ${
                    active
                      ? "bg-[#18181B] text-white"
                      : "bg-[#F4F4F6] text-[#71717A]"
                  }`}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
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
  );
}
