"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
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

const ALL_BRANDS = [
  "samsung",
  "xiaomi",
  "vivo",
  "oppo",
  "infinix",
  "realme",
  "tecno",
  "nokia",
];

export default function BrandStokClient({ brand }: { brand: string }) {
  const rawBrandSlug = (brand || "").toLowerCase();
  const brandConfig = getBrandConfig(rawBrandSlug);

  const [items, setItems] = useState<StokItem[]>([]);
  const [summary, setSummary] = useState<StokSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
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

  // Filter items specifically for this brand
  const brandItems = useMemo(() => {
    return items.filter((it) => {
      const itBrand = (it.brand || "").trim().toLowerCase();
      return (
        itBrand === rawBrandSlug ||
        itBrand === brandConfig.name.toLowerCase()
      );
    });
  }, [items, rawBrandSlug, brandConfig.name]);

  // Brand totals for the switcher
  const brandTotals = useMemo(() => {
    if (summary?.brand_totals) {
      return summary.brand_totals;
    }
    const map: Record<string, number> = {};
    items.forEach((it) => {
      const b = (it.brand || "Lainnya").toLowerCase();
      map[b] = (map[b] || 0) + (it.total_stok || 0);
    });
    return map;
  }, [summary, items]);

  const brandTotalUnits = useMemo(() => {
    return brandItems.reduce((acc, it) => acc + (it.total_stok || 0), 0);
  }, [brandItems]);

  const tanggal = summary?.tanggal || (brandItems[0]?.tanggal ?? "15/11/2026");

  // Filter brand items by search query
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

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedItems(new Set(filteredBrandItems.map((it) => it.id)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col overflow-y-auto">
      {/* Top Navbar */}
      <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/stok"
              className="size-9 rounded-xl border border-line bg-canvas hover:bg-subtle flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
              title="Kembali ke Semua Stok"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div className="flex items-center gap-3">
              <div
                className="size-8 rounded-lg flex items-center justify-center px-1 shrink-0"
                style={{
                  backgroundColor: brandConfig.bgLight,
                  color: brandConfig.color,
                }}
              >
                <BrandLogo
                  brand={brandConfig.slug}
                  className="h-3.5 w-auto max-w-[50px]"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-ink leading-tight">
                    Stok {brandConfig.name}
                  </h1>
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                    style={{
                      backgroundColor: brandConfig.bgLight,
                      color: brandConfig.color,
                    }}
                  >
                    {brandTotalUnits} Unit
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Per {tanggal} &middot; {brandItems.length} Tipe Tersedia
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/stok"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-canvas hover:bg-subtle text-xs font-medium text-ink transition-colors cursor-pointer"
            >
              <span>Semua Brand</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 space-y-6">
        {/* Horizontal Brand Switcher Bar */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
            Ganti Brand:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {ALL_BRANDS.map((slug) => {
              const cfg = BRAND_CONFIGS[slug];
              const isCurrent = slug === rawBrandSlug;
              const count =
                brandTotals[cfg.name] ||
                brandTotals[slug] ||
                brandTotals[slug.toUpperCase()] ||
                0;

              return (
                <Link
                  key={slug}
                  href={`/stok/${slug}`}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shrink-0 select-none ${
                    isCurrent
                      ? "border-brand bg-brand-soft text-brand font-bold shadow-2xs"
                      : "border-line bg-surface hover:bg-canvas text-muted hover:text-ink"
                  }`}
                >
                  <BrandLogo brand={slug} className="h-3 w-auto max-w-[36px]" />
                  <span>{cfg.name}</span>
                  <span
                    className="px-1.5 py-0.2 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: isCurrent ? "rgba(31, 111, 182, 0.15)" : cfg.bgLight,
                      color: isCurrent ? "#1F6FB6" : cfg.color,
                    }}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari tipe di ${brandConfig.name} (contoh: A07, 8/128, Violet)...`}
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

        {/* List Header */}
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <div>
            <h2 className="text-sm font-bold text-ink">
              {searchQuery
                ? `Hasil: ${filteredBrandItems.length} tipe`
                : `Daftar Stok ${brandConfig.name}`}
            </h2>
            <p className="text-xs text-muted">
              {filteredBrandItems.length} tipe terdaftar di gudang
            </p>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Stock Items Container */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted">
            Memuat data stok {brandConfig.name}...
          </div>
        ) : filteredBrandItems.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-line bg-surface/50 text-xs text-muted">
            {searchQuery
              ? `Tidak ada tipe yang cocok dengan "${searchQuery}".`
              : `Belum ada data persediaan untuk brand ${brandConfig.name}.`}
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-2xs divide-y divide-line/70">
            {filteredBrandItems.map((item, idx) => {
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
                  {/* Item Row */}
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
                            {item.rincian_warna
                              .map((w) => `${w.warna} (${w.qty})`)
                              .join(", ")}
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
                      <div className="p-3 rounded-lg border border-line bg-canvas space-y-1.5">
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
        )}
      </main>
    </div>
  );
}
