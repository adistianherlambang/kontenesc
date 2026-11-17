"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Menu,
  Search,
  X,
  LayoutGrid,
  AlignJustify,
  BarChart3,
} from "lucide-react";
import {
  LajulBrandDoc,
  LajulSummary,
  subscribeToLajul,
  getLajulFromDb,
} from "@/lib/firebase";
import LajulSidebar, { LajulStatusView } from "@/components/LajulSidebar";
import StoreSecurityGate from "@/components/StoreSecurityGate";

const ORDERED_BRAND_KEYS = [
  "samsung",
  "xiaomi",
  "vivo",
  "oppo",
  "infinix",
  "realme",
  "tecno",
  "nokia",
  "acc",
];

function formatNumber(val: number | string): string {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString("id-ID");
}

export default function LajulPage() {
  const [brands, setBrands] = useState<LajulBrandDoc[]>([]);
  const [summary, setSummary] = useState<LajulSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<
    "connected" | "offline" | "syncing"
  >("offline");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<LajulStatusView>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("Semua");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      setFirebaseStatus((prev) => (prev === "offline" ? "syncing" : prev));
    };
    const handleOffline = () => setFirebaseStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    getLajulFromDb().then(({ brands: initBrands, summary: initSummary }) => {
      if (initBrands.length > 0) {
        setBrands(initBrands);
        setSummary(initSummary);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToLajul(
      ({ brands: newBrands, summary: newSummary }) => {
        setBrands(newBrands);
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

  const tanggal = summary?.tanggal || brands[0]?.tanggal || "";
  const metrics = summary?.metrics;

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      const idxA = ORDERED_BRAND_KEYS.indexOf(a.brand_key.toLowerCase());
      const idxB = ORDERED_BRAND_KEYS.indexOf(b.brand_key.toLowerCase());
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [brands]);

  const soldBrandsCount = useMemo(() => {
    return sortedBrands.filter((b) => !b.no_sell && b.transaksi.length > 0)
      .length;
  }, [sortedBrands]);

  const noSellBrandsCount = sortedBrands.length - soldBrandsCount;

  const totalTxCount = useMemo(() => {
    return sortedBrands.reduce(
      (acc, b) => acc + (b.transaksi?.length || 0),
      0
    );
  }, [sortedBrands]);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return sortedBrands
      .filter((brandDoc) => {
        const hasSales = !brandDoc.no_sell && brandDoc.transaksi.length > 0;
        if (activeView === "sold" && !hasSales) return false;
        if (activeView === "nosell" && hasSales) return false;
        if (selectedBrand !== "Semua" && brandDoc.brand_key !== selectedBrand) {
          return false;
        }
        return true;
      })
      .map((brandDoc) => {
        if (!q) return brandDoc;
        const brandMatch = brandDoc.brand_name.toLowerCase().includes(q);
        const matchingTx = brandDoc.transaksi.filter(
          (tx) =>
            tx.rincian.toLowerCase().includes(q) ||
            (tx.user || "").toLowerCase().includes(q) ||
            (tx.metode || "").toLowerCase().includes(q)
        );
        if (brandMatch && matchingTx.length === 0) return brandDoc;
        return {
          ...brandDoc,
          transaksi: matchingTx,
        };
      })
      .filter((brandDoc) => {
        if (!q) return true;
        return (
          brandDoc.brand_name.toLowerCase().includes(q) ||
          brandDoc.transaksi.length > 0
        );
      });
  }, [sortedBrands, activeView, selectedBrand, searchQuery]);

  const viewTitle = useMemo(() => {
    if (selectedBrand !== "Semua") {
      const found = sortedBrands.find((b) => b.brand_key === selectedBrand);
      if (found) return found.brand_name;
    }
    switch (activeView) {
      case "sold":
        return "Ada Penjualan";
      case "nosell":
        return "No Sell";
      default:
        return "Semua Penjualan";
    }
  }, [activeView, selectedBrand, sortedBrands]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedBrand("Semua");
    setActiveView("all");
  };

  return (
    <StoreSecurityGate pageTitle="Laporan Penjualan (Lajul)">
      <div className="h-dvh w-full overflow-hidden flex bg-white text-[#18181B] font-sans">
        <LajulSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        totalBrandsCount={sortedBrands.length}
        soldBrandsCount={soldBrandsCount}
        noSellBrandsCount={noSellBrandsCount}
        brands={sortedBrands}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        totalTxCount={totalTxCount}
        metrics={metrics}
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

            <h2 className="text-sm sm:text-base font-bold text-[#18181B] truncate">
              {viewTitle}
            </h2>
            {tanggal && (
              <span className="text-xs text-[#71717A] shrink-0 hidden sm:inline">
                &middot; {tanggal}
              </span>
            )}
          </div>

          {/* Center Search Input (Desktop) */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tipe, user, metode..."
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
              placeholder="Cari tipe, user, metode..."
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

          {/* Mobile Quick Status Filter Pills — matches /konten */}
          <div className="flex items-center gap-1.5 w-full md:hidden overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setActiveView("all")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                activeView === "all"
                  ? "bg-[#18181B] text-white"
                  : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
              }`}
            >
              Semua ({sortedBrands.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView("sold")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                activeView === "sold"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
              }`}
            >
              Terjual ({soldBrandsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveView("nosell")}
              className={`flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                activeView === "nosell"
                  ? "bg-[#1F6FB6] text-white"
                  : "bg-[#F4F4F6] text-[#71717A] active:bg-[#E4E4E7]"
              }`}
            >
              No Sell ({noSellBrandsCount})
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-6">
          {/* Summary Strip */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Unit Terjual", value: String(metrics.unit_terjual) },
                { label: "Cash", value: metrics.cash },
                { label: "Transfer", value: metrics.transfer },
                { label: "Debit", value: metrics.debit },
                {
                  label: "Total Payment",
                  value: metrics.total_payment,
                  fullWidthOnMobile: true,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-xl border border-line bg-surface px-4 py-3 ${
                    stat.fullWidthOnMobile ? "col-span-2 sm:col-span-1" : ""
                  }`}
                >
                  <p className="text-[11px] font-medium text-muted">
                    {stat.label}
                  </p>
                  <p className="text-sm sm:text-[15px] font-bold text-ink mt-0.5 truncate">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Main Content */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted">
              Memuat data penjualan...
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border border-gray-200 flex items-center justify-center text-muted mb-4 shadow-xs">
                <BarChart3 className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-[#18181B] mb-1.5">
                Tidak ada data penjualan ditemukan
              </h3>
              <p className="text-xs max-w-sm text-[#71717A] mb-5">
                Ubah kata kunci pencarian atau reset filter brand untuk menampilkan data kembali.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-black cursor-pointer"
              >
                Tampilkan Semua Penjualan
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-24">
              {filteredBrands.map((brandDoc) => {
                const txList = brandDoc.transaksi || [];
                const isNoSell = brandDoc.no_sell || txList.length === 0;

                return (
                  <article
                    key={brandDoc.brand_key}
                    className="flex flex-col rounded-2xl border border-line bg-surface p-2 sm:p-1.5 transition-all duration-200 hover:shadow-sm"
                  >
                    <header className="flex min-h-10 items-center justify-between gap-2 pl-3 pr-1 pb-2">
                      <span className="truncate text-[13px] font-semibold text-ink">
                        {brandDoc.brand_name}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold shadow-2xs shrink-0 ${
                          isNoSell
                            ? "border-line bg-white text-faint"
                            : "border-success/20 bg-success-soft text-success"
                        }`}
                      >
                        {isNoSell ? "No Sell" : `${txList.length} terjual`}
                      </span>
                    </header>

                    <div className="flex flex-1 flex-col rounded-xl border border-black/[0.04] bg-canvas p-4">
                      {isNoSell ? (
                        <p className="text-xs text-faint py-4 text-center">
                          Tidak ada transaksi
                        </p>
                      ) : (
                        <div className="divide-y divide-line">
                          {txList.map((tx, idx) => (
                            <div
                              key={idx}
                              className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-ink truncate">
                                  {tx.rincian}
                                </p>
                                <p className="text-[11px] text-muted mt-0.5">
                                  {tx.user || "-"} &middot; {tx.metode}
                                </p>
                              </div>
                              <span className="font-semibold text-ink shrink-0">
                                {formatNumber(tx.harga)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6 pb-24">
              {filteredBrands.map((brandDoc) => {
                const txList = brandDoc.transaksi || [];
                const isNoSell = brandDoc.no_sell || txList.length === 0;

                return (
                  <section key={brandDoc.brand_key} className="space-y-2">
                    <div className="flex items-center justify-between px-0.5">
                      <h3 className="text-xs font-semibold text-ink">
                        {brandDoc.brand_name}
                      </h3>
                      <span className="text-[11px] font-medium text-muted">
                        {isNoSell ? "No Sell" : `${txList.length} unit`}
                      </span>
                    </div>

                    <div
                      tabIndex={0}
                      role="region"
                      aria-label={`Tabel ${brandDoc.brand_name}`}
                      className="rounded-xl border border-line bg-canvas overflow-hidden shadow-xs"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr>
                              <th className="th w-12 text-center">No</th>
                              <th className="th min-w-[200px]">Rincian</th>
                              <th className="th w-24">User</th>
                              <th className="th w-28">Metode</th>
                              <th className="th w-28 text-right">Harga</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {isNoSell ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-3 py-3 text-center text-xs text-faint"
                                >
                                  No Sell
                                </td>
                              </tr>
                            ) : (
                              txList.map((tx, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-subtle/50 transition-colors"
                                >
                                  <td className="td text-center text-muted">
                                    {tx.no ?? idx + 1}
                                  </td>
                                  <td className="td font-medium text-ink">
                                    {tx.rincian}
                                  </td>
                                  <td className="td text-muted">
                                    {tx.user || "-"}
                                  </td>
                                  <td className="td text-muted">{tx.metode}</td>
                                  <td className="td text-right font-semibold text-ink">
                                    {formatNumber(tx.harga)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  </StoreSecurityGate>
  );
}
