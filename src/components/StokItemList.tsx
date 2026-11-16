"use client";

import React from "react";
import { Smartphone } from "lucide-react";
import { StokItem } from "@/lib/firebase";

interface StokItemListProps {
  items: StokItem[];
  viewMode: "grid" | "table";
  isLoading: boolean;
  showBrand?: boolean;
  emptyMessage?: string;
  onResetSearch?: () => void;
}

export default function StokItemList({
  items,
  viewMode,
  isLoading,
  showBrand = false,
  emptyMessage = "Tidak ada data stok ditemukan",
  onResetSearch,
}: StokItemListProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-muted text-xs">
        Memuat data stok...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-gray-400">
        <div className="size-14 rounded-2xl bg-surface border border-line flex items-center justify-center text-muted mb-3 shadow-2xs">
          <Smartphone className="size-6" />
        </div>
        <h3 className="text-sm font-bold text-ink mb-1">
          {emptyMessage}
        </h3>
        <p className="text-xs max-w-sm text-muted mb-4">
          Coba ubah kata kunci pencarian tipe atau warna untuk menemukan stok.
        </p>
        {onResetSearch && (
          <button
            type="button"
            onClick={onResetSearch}
            className="px-4 py-2 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-black active:scale-95 transition-all cursor-pointer"
          >
            Reset Pencarian
          </button>
        )}
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 pb-20">
        {items.map((item) => {
          const hasWarna =
            Array.isArray(item.rincian_warna) && item.rincian_warna.length > 0;

          return (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-canvas p-4 sm:p-5 shadow-2xs hover:border-line-strong hover:shadow-sm transition-all duration-200"
            >
              {/* Header: Title & Total Stock Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    {showBrand && (
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">
                        {item.brand}
                      </span>
                    )}
                    <h3 className="text-sm sm:text-[15px] font-bold text-ink leading-snug group-hover:text-brand transition-colors">
                      {item.tipe}
                    </h3>
                  </div>

                  {/* Stock Badge */}
                  <div className="shrink-0 inline-flex items-baseline gap-1 px-2.5 py-1 rounded-xl bg-subtle border border-line shadow-2xs">
                    <span className="text-xs sm:text-[13px] font-bold text-ink">
                      {item.total_stok}
                    </span>
                    <span className="text-[10px] text-muted font-medium">unit</span>
                  </div>
                </div>
              </div>

              {/* Color Variants: Direct visual chips */}
              <div className="pt-3 mt-3 border-t border-line/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                    Rincian Warna
                  </span>
                  <span className="text-[11px] font-medium text-muted">
                    {hasWarna ? `${item.rincian_warna.length} warna` : "-"}
                  </span>
                </div>

                {hasWarna ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.rincian_warna.map((w, wIdx) => (
                      <span
                        key={wIdx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-line text-xs font-medium text-ink transition-colors hover:bg-subtle"
                      >
                        <span className="size-2 rounded-full bg-line-strong ring-1 ring-black/10 shrink-0" />
                        <span className="capitalize">{w.warna}</span>
                        <span className="font-bold text-ink bg-canvas px-1.5 py-0.5 rounded border border-line/70 text-[11px] ml-0.5">
                          {w.qty}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-faint italic py-0.5">
                    Tidak ada rincian warna
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  // Table view
  return (
    <div className="pb-20">
      <div className="rounded-xl border border-line bg-canvas overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th className="th w-12 text-center">No</th>
                {showBrand && <th className="th whitespace-nowrap">Brand</th>}
                <th className="th min-w-[200px]">Tipe Handphone</th>
                <th className="th w-24 text-right">Total Stok</th>
                <th className="th min-w-[260px]">Rincian Warna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item, idx) => {
                const hasWarna =
                  Array.isArray(item.rincian_warna) &&
                  item.rincian_warna.length > 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-subtle/50 transition-colors"
                  >
                    <td className="td text-center text-muted font-medium">
                      {idx + 1}
                    </td>
                    {showBrand && (
                      <td className="td font-medium text-muted">
                        {item.brand}
                      </td>
                    )}
                    <td className="td font-bold text-ink">{item.tipe}</td>
                    <td className="td text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-subtle border border-line font-bold text-ink">
                        {item.total_stok}
                      </span>
                    </td>
                    <td className="td py-2">
                      {hasWarna ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.rincian_warna.map((w, wIdx) => (
                            <span
                              key={wIdx}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface border border-line text-[11px] text-ink"
                            >
                              <span className="size-1.5 rounded-full bg-muted/60" />
                              <span className="capitalize">{w.warna}</span>
                              <span className="font-bold text-ink ml-0.5">
                                ({w.qty})
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-faint">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
