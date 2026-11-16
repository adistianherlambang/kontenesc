"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ChevronDown, X } from "lucide-react";
import {
  StokItem,
  subscribeToStok,
  getStokFromDb,
} from "@/lib/firebase";
import { BrandLogo, getBrandConfig } from "@/lib/brandLogos";

export default function BrandStokClient({ brand }: { brand: string }) {
  const rawBrandSlug = (brand || "").toLowerCase();
  const brandConfig = getBrandConfig(rawBrandSlug);

  const [items, setItems] = useState<StokItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    getStokFromDb().then(({ items: initItems }) => {
      if (initItems.length > 0) {
        setItems(initItems);
        setIsLoading(false);
      }
    });

    const unsub = subscribeToStok(({ items: newItems }) => {
      setItems(newItems);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

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
              href="/stok"
              className="btn btn-ghost btn-icon -ml-2"
              aria-label="Kembali ke Stok"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <BrandLogo brand={rawBrandSlug} className="h-4 w-auto text-ink" />
          </div>

          <span className="text-xs font-medium text-muted">
            Total <strong className="text-ink font-semibold">{brandTotalUnits}</strong>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 w-full flex-1 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-faint pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari tipe di ${brandConfig.name}...`}
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

        {/* Stock Items */}
        <div className="rounded-xl border border-line bg-canvas overflow-hidden">
          <div className="px-4 py-2.5 bg-surface border-b border-line flex items-center justify-between text-xs font-medium text-muted">
            <div className="flex items-center gap-3">
              <span className="w-6">No</span>
              <span>Rincian</span>
            </div>
            <span className="pr-6">Stok</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted">
              Memuat data...
            </div>
          ) : filteredBrandItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : "Belum ada data stok"}
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredBrandItems.map((item, idx) => {
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
                        {item.rincian_warna.map((wItem, wIdx) => (
                          <div
                            key={wIdx}
                            className="flex items-center justify-between pl-9 pr-6 py-1.5 text-xs"
                          >
                            <span className="text-muted capitalize">
                              {wItem.warna}
                            </span>
                            <span className="font-medium text-ink">
                              {wItem.qty}
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
      </main>
    </div>
  );
}
