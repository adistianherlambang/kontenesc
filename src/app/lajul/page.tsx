"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ArrowRight,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import {
  LajulBrandDoc,
  LajulSummary,
  subscribeToLajul,
  getLajulFromDb,
} from "@/lib/firebase";
import { BrandLogo, getBrandConfig } from "@/lib/brandLogos";

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

function formatRupiahSimple(val: number | string): string {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString("id-ID");
}

export default function LajulPage() {
  const [brands, setBrands] = useState<LajulBrandDoc[]>([]);
  const [summary, setSummary] = useState<LajulSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");

  useEffect(() => {
    getLajulFromDb().then(({ brands: initBrands, summary: initSummary }) => {
      if (initBrands.length > 0) {
        setBrands(initBrands);
        setSummary(initSummary);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToLajul(({ brands: newBrands, summary: newSummary }) => {
      setBrands(newBrands);
      setSummary(newSummary);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const tanggal = summary?.tanggal || (brands[0]?.tanggal ?? "15/11/2026");

  // Sort brands according to ordered keys
  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      const idxA = ORDERED_BRAND_KEYS.indexOf(a.brand_key.toLowerCase());
      const idxB = ORDERED_BRAND_KEYS.indexOf(b.brand_key.toLowerCase());
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [brands]);

  // Filtered brands and transactions
  const displayedBrands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return sortedBrands
      .filter((b) => {
        if (selectedBrandFilter !== "all" && b.brand_key.toLowerCase() !== selectedBrandFilter) {
          return false;
        }
        return true;
      })
      .map((b) => {
        if (!q) return b;
        const filteredTx = b.transaksi.filter((t) => {
          return (
            t.rincian.toLowerCase().includes(q) ||
            t.user.toLowerCase().includes(q) ||
            t.metode.toLowerCase().includes(q) ||
            String(t.harga).includes(q)
          );
        });

        return {
          ...b,
          transaksi: filteredTx,
          total_transaksi: filteredTx.length,
        };
      })
      .filter((b) => {
        if (!q) return true;
        return b.transaksi.length > 0;
      });
  }, [sortedBrands, selectedBrandFilter, searchQuery]);

  const metrics = summary?.metrics || {
    unit_terjual: 40,
    cash: "36.535",
    transfer: "17.100",
    debit: "0",
    total_payment: "53.635",
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col overflow-y-auto">
      {/* Top Header */}
      <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="size-9 rounded-xl border border-line bg-canvas hover:bg-subtle flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
              title="Kembali ke Portal Hub"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-ink leading-tight">
                  Laporan Penjualan (Lajul)
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#4F46E5]/10 text-[#4F46E5]">
                  {metrics.unit_terjual} Unit Terjual
                </span>
              </div>
              <p className="text-xs text-muted">
                Rekap Transaksi Harian Toko &middot; Per {tanggal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/stok"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-canvas hover:bg-subtle text-xs font-medium text-ink transition-colors cursor-pointer"
            >
              <Smartphone className="size-3.5" />
              <span className="hidden sm:inline">Stok Gudang</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 space-y-6">
        {/* Summary Metrics Cards (as in lajul_from_sql.pdf) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Unit Terjual */}
          <div className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Unit Terjual
              </span>
              <Smartphone className="size-3.5" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-ink">
              {metrics.unit_terjual}
            </p>
            <span className="text-[10px] text-muted">Total unit gadget</span>
          </div>

          {/* Cash */}
          <div className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Cash
              </span>
              <Banknote className="size-3.5 text-success" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-ink">
              {metrics.cash}
            </p>
            <span className="text-[10px] text-muted">Tunai (ribu)</span>
          </div>

          {/* Transfer */}
          <div className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Transfer
              </span>
              <CreditCard className="size-3.5 text-[#1F6FB6]" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-ink">
              {metrics.transfer}
            </p>
            <span className="text-[10px] text-muted">Bank transfer (ribu)</span>
          </div>

          {/* Debit */}
          <div className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Debit
              </span>
              <Wallet className="size-3.5 text-muted" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-ink">
              {metrics.debit}
            </p>
            <span className="text-[10px] text-muted">EDC debit (ribu)</span>
          </div>

          {/* Total Payment */}
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-[#4F46E5]/40 bg-[#4F46E5]/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#4F46E5] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Payment
              </span>
              <TrendingUp className="size-3.5" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#4F46E5]">
              {metrics.total_payment}
            </p>
            <span className="text-[10px] text-muted">Total omset (ribu)</span>
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rincian transaksi, nama pembeli, atau metode (contoh: SAMSUNG, TEMPERED, Cash)..."
              className="input pl-10 pr-10 text-xs sm:text-sm py-2.5 h-11 w-full bg-surface focus:bg-canvas rounded-xl shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Brand Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedBrandFilter("all")}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedBrandFilter === "all"
                  ? "border-brand bg-brand-soft text-brand font-bold"
                  : "border-line bg-surface hover:bg-subtle text-muted hover:text-ink"
              }`}
            >
              Semua Brand
            </button>

            {sortedBrands.map((b) => {
              const isSelected = selectedBrandFilter === b.brand_key.toLowerCase();
              const count = b.transaksi.length;

              return (
                <button
                  type="button"
                  key={b.brand_key}
                  onClick={() => setSelectedBrandFilter(b.brand_key.toLowerCase())}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand-soft text-brand font-bold"
                      : "border-line bg-surface hover:bg-subtle text-muted hover:text-ink"
                  }`}
                >
                  <span>{b.brand_name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      count > 0 ? "bg-subtle text-ink" : "bg-transparent text-muted"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand Tables Section */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted">
            Memuat data laporan penjualan dari Firebase...
          </div>
        ) : displayedBrands.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-line bg-surface/50 text-xs text-muted">
            Tidak ada transaksi yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          <div className="space-y-6">
            {displayedBrands.map((brandDoc) => {
              const bConfig = getBrandConfig(brandDoc.brand_key);
              const txList = brandDoc.transaksi || [];
              const isNoSell = brandDoc.no_sell || txList.length === 0;

              return (
                <div
                  key={brandDoc.brand_key}
                  className="rounded-xl border border-line bg-surface overflow-hidden shadow-2xs"
                >
                  {/* Table Header / Brand Card Banner */}
                  <div className="px-4 py-3 bg-subtle/70 border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="size-6 rounded-md flex items-center justify-center px-1"
                        style={{ backgroundColor: bConfig.bgLight, color: bConfig.color }}
                      >
                        <BrandLogo brand={bConfig.slug} className="h-3 w-auto max-w-[40px]" />
                      </div>
                      <span className="text-xs font-bold text-ink">
                        {brandDoc.brand_name}
                      </span>
                    </div>

                    <div>
                      {isNoSell ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-line text-muted">
                          No Sell
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-canvas text-ink border border-line">
                          {txList.length} Transaksi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Transactions Table (Responsive conforming to modern web guidance) */}
                  {isNoSell ? (
                    <div className="py-6 text-center text-xs text-muted italic">
                      Tidak ada transaksi penjualan untuk brand ini.
                    </div>
                  ) : (
                    <div
                      tabIndex={0}
                      role="region"
                      aria-label={`Tabel Penjualan ${brandDoc.brand_name}`}
                      className="overflow-x-auto max-w-full"
                    >
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-line bg-canvas/40 text-[11px] font-semibold text-muted uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-12 text-center">No</th>
                            <th className="py-2.5 px-4">Rincian Barang</th>
                            <th className="py-2.5 px-4 w-24">User</th>
                            <th className="py-2.5 px-4 w-28 text-center">Metode</th>
                            <th className="py-2.5 px-4 w-28 text-right">Harga</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/60 bg-canvas">
                          {txList.map((tx, idx) => {
                            const isCash = tx.metode?.toLowerCase() === "cash";
                            const isTransfer = tx.metode?.toLowerCase() === "transfer";

                            return (
                              <tr
                                key={idx}
                                className="hover:bg-subtle/50 transition-colors"
                              >
                                <td className="py-2.5 px-4 text-center text-muted font-medium">
                                  {tx.no ?? idx + 1}
                                </td>
                                <td className="py-2.5 px-4 font-semibold text-ink">
                                  {tx.rincian}
                                </td>
                                <td className="py-2.5 px-4 text-muted">
                                  {tx.user || "-"}
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      isCash
                                        ? "bg-success-soft text-success"
                                        : isTransfer
                                        ? "bg-brand-soft text-brand"
                                        : "bg-subtle text-muted"
                                    }`}
                                  >
                                    {tx.metode}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold text-ink">
                                  {formatRupiahSimple(tx.harga)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
