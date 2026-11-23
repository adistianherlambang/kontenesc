"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  X,
  LayoutGrid,
  AlignJustify,
  Menu,
  ChevronDown,
  Smartphone,
  Headphones,
} from "lucide-react";
import { StokItem, StokSummary } from "@/lib/firebase";
import { fetchStokCached } from "@/lib/dataCache";
import { computeStokTotals, isAccItem } from "@/lib/stokHelpers";
import { BrandLogo, getBrandConfig } from "@/lib/brandLogos";
import StokSidebar from "@/components/StokSidebar";
import StokItemList from "@/components/StokItemList";
import SortSelect, { StokSortOption } from "@/components/SortSelect";
import StoreSecurityGate from "@/components/StoreSecurityGate";
import { addOneDay } from "@/app/stok/page";
import LoadingPage from "@/components/LoadingPage";

export default function BrandStokClient({ brand }: { brand: string }) {
  const searchParams = useSearchParams();
  const kategoriParam = (searchParams.get("kategori") || "").toLowerCase();
  const rawBrandSlug = (brand || "").toLowerCase();
  const brandConfig = getBrandConfig(rawBrandSlug);

  const [items, setItems] = useState<StokItem[]>([]);
  const [summary, setSummary] = useState<StokSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<
    "connected" | "offline" | "syncing"
  >("offline");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<StokSortOption>("name-asc");
  const [hpOpen, setHpOpen] = useState(() => kategoriParam !== "acc");
  const [accOpen, setAccOpen] = useState(() => kategoriParam === "acc");

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 10000);

    const handleOnline = () => {
      setFirebaseStatus((prev) => (prev === "offline" ? "connected" : prev));
    };
    const handleOffline = () => setFirebaseStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    fetchStokCached()
      .then(({ items: initItems, summary: initSummary }) => {
        if (!isMounted) return;
        setItems(initItems);
        setSummary(initSummary);
        setFirebaseStatus(
          typeof window !== "undefined" && !window.navigator.onLine
            ? "offline"
            : "connected"
        );
      })
      .catch(() => {
        if (!isMounted) return;
        if (typeof window !== "undefined" && !window.navigator.onLine) {
          setFirebaseStatus("offline");
        }
      })
      .finally(() => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setFirebaseStatus("syncing");
    try {
      const { items: freshItems, summary: freshSummary } =
        await fetchStokCached(true);
      setItems(freshItems);
      setSummary(freshSummary);
      setFirebaseStatus(
        typeof window !== "undefined" && !window.navigator.onLine
          ? "offline"
          : "connected"
      );
    } catch {
      if (typeof window !== "undefined" && !window.navigator.onLine) {
        setFirebaseStatus("offline");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const stokTotals = useMemo(
    () => computeStokTotals(items, summary),
    [items, summary]
  );

  const tanggal = addOneDay(summary?.tanggal || items[0]?.tanggal || "");

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

  const handphoneItems = useMemo(
    () => filteredBrandItems.filter((it) => !isAccItem(it)),
    [filteredBrandItems]
  );

  const accItems = useMemo(
    () => filteredBrandItems.filter((it) => isAccItem(it)),
    [filteredBrandItems]
  );

  const handphoneUnits = useMemo(
    () => handphoneItems.reduce((acc, it) => acc + (it.total_stok || 0), 0),
    [handphoneItems]
  );

  const accUnits = useMemo(
    () => accItems.reduce((acc, it) => acc + (it.total_stok || 0), 0),
    [accItems]
  );

  const isSearching = Boolean(searchQuery.trim());
  const effectiveHpOpen = isSearching ? handphoneItems.length > 0 : hpOpen;
  const effectiveAccOpen = isSearching ? accItems.length > 0 : accOpen;

  return (
    <StoreSecurityGate pageTitle={`Stok ${brandConfig.name}`}>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="h-dvh w-full overflow-hidden flex bg-white text-[#18181B] font-sans">
        <StokSidebar
          activeBrand={rawBrandSlug}
          brandTotals={stokTotals.brandTotals}
          totalUnits={stokTotals.totalUnits}
          totalHpUnits={stokTotals.totalHpUnits}
          totalAccUnits={stokTotals.totalAccUnits}
          tanggal={tanggal}
          firebaseStatus={firebaseStatus}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          items={items}
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
          <div className="space-y-6 pb-20">
            <details
              open={effectiveHpOpen}
              onToggle={(e) => {
                if (!isSearching) setHpOpen(e.currentTarget.open);
              }}
              className="stok-disclosure"
            >
              <summary className="flex items-center gap-2 py-2.5 border-b border-line text-xs sm:text-[13px] font-semibold text-ink cursor-pointer select-none hover:text-brand transition-colors">
                <ChevronDown
                  className="stok-disclosure-chevron size-4 text-muted shrink-0"
                  aria-hidden="true"
                />
                <Smartphone
                  className="size-4 text-muted shrink-0"
                  aria-hidden="true"
                />
                <span>Handphone</span>
                <span className="ml-auto text-xs font-medium text-muted tabular-nums">
                  {handphoneItems.length} tipe • {handphoneUnits} unit
                </span>
              </summary>

              <div className="pt-4">
                <StokItemList
                  items={handphoneItems}
                  viewMode={viewMode}
                  isLoading={false}
                  itemLabel="Tipe Handphone"
                  embedded
                  emptyMessage={
                    searchQuery
                      ? `Tidak ada hasil handphone untuk "${searchQuery}"`
                      : `Belum ada data stok handphone ${brandConfig.name}`
                  }
                  onResetSearch={
                    searchQuery ? () => setSearchQuery("") : undefined
                  }
                />
              </div>
            </details>

            <details
              open={effectiveAccOpen}
              onToggle={(e) => {
                if (!isSearching) setAccOpen(e.currentTarget.open);
              }}
              className="stok-disclosure"
            >
              <summary className="flex items-center gap-2 py-2.5 border-b border-line text-xs sm:text-[13px] font-semibold text-ink cursor-pointer select-none hover:text-brand transition-colors">
                <ChevronDown
                  className="stok-disclosure-chevron size-4 text-muted shrink-0"
                  aria-hidden="true"
                />
                <Headphones
                  className="size-4 text-muted shrink-0"
                  aria-hidden="true"
                />
                <span>ACC</span>
                <span className="ml-auto text-xs font-medium text-muted tabular-nums">
                  {accItems.length} tipe • {accUnits} unit
                </span>
              </summary>

              <div className="pt-4">
                <StokItemList
                  items={accItems}
                  viewMode={viewMode}
                  isLoading={false}
                  itemLabel="Nama ACC"
                  embedded
                  emptyMessage={
                    searchQuery
                      ? `Tidak ada hasil ACC untuk "${searchQuery}"`
                      : `Belum ada data stok ACC ${brandConfig.name}`
                  }
                  onResetSearch={
                    searchQuery ? () => setSearchQuery("") : undefined
                  }
                />
              </div>
            </details>
          </div>
        </div>
      </main>
    </div>
      )}
  </StoreSecurityGate>
  );
}
