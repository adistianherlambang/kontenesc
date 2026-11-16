"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  Palette,
} from "lucide-react";
import {
  StokItem,
  StokSummary,
  subscribeToStok,
  getStokFromDb,
} from "@/lib/firebase";
import { BrandLogo, getBrandConfig, BRAND_CONFIGS } from "@/lib/brandLogos";

const ORDERED_BRANDS = [
  "samsung",
  "xiaomi",
  "vivo",
  "oppo",
  "infinix",
  "realme",
  "tecno",
  "nokia",
];

export default function StokOverviewPage() {
  const [items, setItems] = useState<StokItem[]>([]);
  const [summary, setSummary] = useState<StokSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initial fetch + real-time subscription
    getStokFromDb().then(({ items: initItems, summary: initSummary }) => {
      if (initItems.length > 0) {
        setItems(initItems);
        setSummary(initSummary);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToStok(({ items: newItems, summary: newSummary }) => {
      setItems(newItems);
      setSummary(newSummary);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Compute brand totals if summary is missing
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

  const tanggal = summary?.tanggal || (items[0]?.tanggal ?? "15/11/2026");

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((it) => {
      const matchTipe = it.tipe.toLowerCase().includes(q);
      const matchBrand = it.brand.toLowerCase().includes(q);
      const matchWarna = it.rincian_warna?.some((w) =>
        w.warna.toLowerCase().includes(q)
      );
      return matchTipe || matchBrand || matchWarna;
    });
  }, [items, searchQuery]);

  // Group filtered items by brand
  const groupedFilteredItems = useMemo(() => {
    const map = new Map<string, StokItem[]>();
    filteredItems.forEach((it) => {
      const b = it.brand || "Lainnya";
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(it);
    });
    return map;
  }, [filteredItems]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedItems(new Set(filteredItems.map((it) => it.id)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col overflow-y-auto">
      {/* Top Navbar */}
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
                  Stok Handphone
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-success-soft text-success">
                  {totalUnits} Unit Gudang
                </span>
              </div>
              <p className="text-xs text-muted">
                Laporan Persediaan Barang &middot; Per {tanggal}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="sm:hidden px-2 py-1 rounded-md text-xs font-semibold bg-success-soft text-success">
              {totalUnits} Unit
            </span>
            <Link
              href="/lajul"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-canvas hover:bg-subtle text-xs font-medium text-ink transition-colors cursor-pointer"
            >
              <span>Laporan Penjualan</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 space-y-8">
        {/* Search Bar & Quick Controls */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tipe handphone, seri RAM/ROM, atau warna (contoh: A07, 8/256, Violet)..."
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
        </div>

        {/* Brand Access Cards (Navigates to /stok/[brand]) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Pilih Brand Handphone
            </label>
            <span className="text-xs text-muted">8 Brand Resmi</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ORDERED_BRANDS.map((slug) => {
              const cfg = BRAND_CONFIGS[slug];
              const count =
                brandTotals[cfg.name] ||
                brandTotals[slug] ||
                brandTotals[slug.toUpperCase()] ||
                0;

              return (
                <Link
                  key={slug}
                  href={`/stok/${slug}`}
                  className="group relative flex flex-col justify-between p-4 rounded-xl border border-line bg-surface hover:bg-canvas transition-all duration-200 hover:shadow-md cursor-pointer hover:border-brand/40"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.bgLight, color: cfg.color }}
                    >
                      <BrandLogo brand={slug} className="h-3.5 max-w-[50px] w-auto" />
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                      style={{ backgroundColor: cfg.bgLight, color: cfg.color }}
                    >
                      {count}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:text-brand transition-colors">
                        {cfg.name}
                      </p>
                      <p className="text-[10px] text-muted">Lihat Detail Stok</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Stock List Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line">
            <div>
              <h2 className="text-sm font-bold text-ink">
                {searchQuery
                  ? `Hasil Pencarian: "${searchQuery}" (${filteredItems.length} tipe)`
                  : "Daftar Persediaan Unit Handphone"}
              </h2>
              <p className="text-xs text-muted">
                Klik tombol detail warna pada setiap item untuk melihat rincian stok warna
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 rounded-md border border-line bg-surface hover:bg-subtle text-[11px] font-medium text-ink transition-colors cursor-pointer"
              >
                Buka Semua
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-md border border-line bg-surface hover:bg-subtle text-[11px] font-medium text-ink transition-colors cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted">
              Memuat data stok dari Firebase...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-line bg-surface/50 text-xs text-muted">
              Tidak ada tipe handphone yang cocok dengan pencarian "{searchQuery}".
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedFilteredItems.entries()).map(([brandName, brandItems]) => {
                const bConfig = getBrandConfig(brandName);
                const subtotal = brandItems.reduce((acc, it) => acc + (it.total_stok || 0), 0);

                return (
                  <div
                    key={brandName}
                    className="rounded-xl border border-line bg-surface overflow-hidden shadow-2xs"
                  >
                    {/* Brand Section Header */}
                    <div className="px-4 py-3 bg-subtle/60 border-b border-line flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-6 rounded-md flex items-center justify-center px-1"
                          style={{ backgroundColor: bConfig.bgLight, color: bConfig.color }}
                        >
                          <BrandLogo brand={bConfig.slug} className="h-3 w-auto max-w-[40px]" />
                        </div>
                        <span className="text-xs font-bold text-ink">
                          {bConfig.name}
                        </span>
                        <span className="text-[11px] text-muted">
                          ({brandItems.length} tipe)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                          style={{ backgroundColor: bConfig.bgLight, color: bConfig.color }}
                        >
                          Total {subtotal} Unit
                        </span>
                        <Link
                          href={`/stok/${bConfig.slug}`}
                          className="text-[11px] text-brand hover:underline font-medium ml-1"
                        >
                          Lihat Brand &rarr;
                        </Link>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-line/70">
                      {brandItems.map((item, idx) => {
                        const isExpanded = expandedItems.has(item.id);
                        const hasWarna =
                          Array.isArray(item.rincian_warna) &&
                          item.rincian_warna.length > 0;

                        return (
                          <div
                            key={item.id}
                            className={`transition-colors ${
                              isExpanded ? "bg-canvas" : "hover:bg-canvas/60"
                            }`}
                          >
                            {/* Main Item Row */}
                            <div className="px-4 py-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs text-muted font-medium w-5 shrink-0 text-center">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-ink truncate">
                                    {item.tipe}
                                  </p>
                                  {hasWarna && (
                                    <p className="text-[11px] text-muted truncate">
                                      {item.rincian_warna.map((w) => `${w.warna} (${w.qty})`).join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-subtle text-ink">
                                  {item.total_stok} Unit
                                </span>

                                {hasWarna ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleItem(item.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                                      isExpanded
                                        ? "border-brand bg-brand-soft text-brand font-semibold"
                                        : "border-line bg-canvas hover:bg-subtle text-muted hover:text-ink"
                                    }`}
                                    title="Detail variasi warna"
                                  >
                                    <Palette className="size-3" />
                                    <span className="hidden sm:inline">Warna</span>
                                    {isExpanded ? (
                                      <ChevronUp className="size-3.5" />
                                    ) : (
                                      <ChevronDown className="size-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-muted italic px-2">
                                    -
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dropdown Detail Warna */}
                            {isExpanded && hasWarna && (
                              <div className="px-4 pb-3 pt-1 border-t border-line/60 bg-subtle/30">
                                <div className="p-2.5 rounded-lg border border-line bg-canvas space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted uppercase tracking-wider px-1">
                                    <span>Varian Warna</span>
                                    <span>Jumlah Stok</span>
                                  </div>
                                  <div className="divide-y divide-line/40">
                                    {item.rincian_warna.map((wItem, wIdx) => (
                                      <div
                                        key={wIdx}
                                        className="flex items-center justify-between py-1.5 px-1 text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="size-2 rounded-full bg-brand/60" />
                                          <span className="font-medium text-ink capitalize">
                                            {wItem.warna}
                                          </span>
                                        </div>
                                        <span className="font-bold text-ink">
                                          {wItem.qty} Unit
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
