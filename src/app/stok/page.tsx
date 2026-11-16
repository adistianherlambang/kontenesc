"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import {
  StokItem,
  StokSummary,
  subscribeToStok,
  getStokFromDb,
} from "@/lib/firebase";
import { BrandLogo, BRAND_LIST } from "@/lib/brandLogos";

export default function StokOverviewPage() {
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

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return items.filter((it) => {
      const matchTipe = it.tipe.toLowerCase().includes(q);
      const matchBrand = it.brand.toLowerCase().includes(q);
      const matchWarna = it.rincian_warna?.some((w) =>
        w.warna.toLowerCase().includes(q)
      );
      return matchTipe || matchBrand || matchWarna;
    });
  }, [items, searchQuery]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-canvas flex flex-col overflow-y-auto">
      <header className="border-b border-line bg-canvas sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="btn btn-ghost btn-icon -ml-2"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-sm font-semibold text-ink">Stok</h1>
            {tanggal && (
              <span className="text-xs text-faint">&middot; {tanggal}</span>
            )}
          </div>

          <span className="text-xs font-medium text-muted">
            Total <strong className="text-ink font-semibold">{totalUnits}</strong>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 w-full flex-1 space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-faint pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tipe atau warna..."
            className="input pl-10 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-faint hover:text-ink cursor-pointer"
              aria-label="Hapus pencarian"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {searchQuery.trim() ? (
          /* Hasil Pencarian Langsung */
          <div className="rounded-xl border border-line bg-canvas overflow-hidden">
            <div className="px-4 py-2.5 bg-surface border-b border-line flex items-center justify-between text-xs font-medium text-muted">
              <div className="flex items-center gap-3">
                <span className="w-6">No</span>
                <span>Rincian</span>
              </div>
              <span className="pr-6">Stok</span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                Tidak ditemukan hasil untuk &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="divide-y divide-line">
                {filteredItems.map((item, idx) => {
                  const isExpanded = expandedItems.has(item.id);
                  const hasWarna =
                    Array.isArray(item.rincian_warna) &&
                    item.rincian_warna.length > 0;

                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => hasWarna && toggleItem(item.id)}
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-subtle/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-faint w-6 shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[13px] font-medium text-ink truncate">
                            {item.tipe}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[13px] font-semibold text-ink">
                            {item.total_stok}
                          </span>
                          <ChevronDown
                            className={`size-4 text-faint transition-transform ${
                              isExpanded ? "rotate-180 text-ink" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && hasWarna && (
                        <div className="bg-surface border-t border-line px-4 py-2 divide-y divide-line/50">
                          {item.rincian_warna.map((w, wIdx) => (
                            <div
                              key={wIdx}
                              className="flex items-center justify-between pl-9 pr-6 py-1.5 text-xs"
                            >
                              <span className="text-muted capitalize">
                                {w.warna}
                              </span>
                              <span className="font-medium text-ink">
                                {w.qty}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Daftar Brand */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BRAND_LIST.map(({ slug, name }) => {
              const count =
                brandTotals[name] ??
                brandTotals[slug] ??
                brandTotals[slug.toUpperCase()] ??
                0;

              return (
                <Link
                  key={slug}
                  href={`/stok/${slug}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3.5 text-ink transition-colors hover:bg-subtle active:bg-line/60"
                >
                  <BrandLogo brand={slug} className="h-4 w-auto text-ink" />
                  <span className="flex items-center gap-2.5">
                    <span className="text-[13px] font-semibold text-ink">
                      {isLoading ? "…" : count}
                    </span>
                    <ChevronRight className="size-4 text-faint" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
