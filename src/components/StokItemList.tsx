"use client";

import React, { useState } from "react";
import { ChevronDown, Smartphone } from "lucide-react";
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 text-muted text-xs">
        Memuat data stok...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 sm:p-12 text-gray-400">
        <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border border-gray-200 flex items-center justify-center text-muted mb-4 shadow-xs">
          <Smartphone className="size-6" />
        </div>
        <h3 className="text-sm font-bold text-[#18181B] mb-1.5">
          {emptyMessage}
        </h3>
        <p className="text-xs max-w-sm text-[#71717A] mb-5">
          Ubah kata kunci pencarian atau pilih brand lain untuk menampilkan data.
        </p>
        {onResetSearch && (
          <button
            type="button"
            onClick={onResetSearch}
            className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-black cursor-pointer"
          >
            Reset Pencarian
          </button>
        )}
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 pb-24">
        {items.map((item, idx) => {
          const isExpanded = expandedItems.has(item.id);
          const hasWarna =
            Array.isArray(item.rincian_warna) && item.rincian_warna.length > 0;

          return (
            <article
              key={item.id}
              className="flex flex-col rounded-2xl border border-line bg-surface p-2 sm:p-1.5 transition-all duration-200 hover:shadow-sm"
            >
              {/* Top frame header — matches ContentCard */}
              <header className="flex min-h-10 items-center justify-between gap-2 pl-3 pr-1 pb-2">
                <span className="truncate text-[13px] font-semibold text-muted">
                  {showBrand ? item.brand : `#${idx + 1}`}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg border border-line-strong bg-white text-xs font-semibold text-ink shadow-2xs shrink-0">
                  {item.total_stok} unit
                </span>
              </header>

              {/* Inner white sheet */}
              <div className="flex flex-1 flex-col rounded-xl border border-black/[0.04] bg-canvas p-4">
                <h4 className="mb-3 text-[15px] font-semibold leading-snug text-ink">
                  {item.tipe}
                </h4>

                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={() => hasWarna && toggleItem(item.id)}
                    disabled={!hasWarna}
                    className={`w-full flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium transition-colors ${
                      hasWarna
                        ? "text-muted hover:bg-subtle hover:text-ink cursor-pointer"
                        : "text-faint opacity-70 cursor-default"
                    }`}
                  >
                    <span>
                      {hasWarna
                        ? `Detail Warna (${item.rincian_warna.length})`
                        : "Tidak ada rincian warna"}
                    </span>
                    {hasWarna && (
                      <ChevronDown
                        className={`size-4 text-faint transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-ink" : ""
                        }`}
                      />
                    )}
                  </button>

                  {isExpanded && hasWarna && (
                    <div className="mt-2 rounded-xl border border-line bg-surface/60 divide-y divide-line overflow-hidden">
                      {item.rincian_warna.map((wItem, wIdx) => (
                        <div
                          key={wIdx}
                          className="flex items-center justify-between px-3 py-2 text-xs"
                        >
                          <span className="text-muted capitalize">
                            {wItem.warna}
                          </span>
                          <span className="font-semibold text-ink">
                            {wItem.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  // Table view — matches ContentTable
  return (
    <div className="pb-24">
      <div className="rounded-xl border border-line bg-canvas overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr>
                <th className="th w-14 text-center">No</th>
                {showBrand && <th className="th whitespace-nowrap">Brand</th>}
                <th className="th min-w-[200px]">Tipe Handphone</th>
                <th className="th w-24 text-right">Total Stok</th>
                <th className="th w-40 text-right">Rincian Warna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item, idx) => {
                const isExpanded = expandedItems.has(item.id);
                const hasWarna =
                  Array.isArray(item.rincian_warna) &&
                  item.rincian_warna.length > 0;
                const colSpan = showBrand ? 5 : 4;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => hasWarna && toggleItem(item.id)}
                      className={`hover:bg-subtle/50 transition-colors ${
                        hasWarna ? "cursor-pointer" : ""
                      }`}
                    >
                      <td className="td text-center text-muted">
                        {idx + 1}
                      </td>
                      {showBrand && (
                        <td className="td whitespace-nowrap text-muted font-medium">
                          {item.brand}
                        </td>
                      )}
                      <td className="td font-medium text-ink">{item.tipe}</td>
                      <td className="td text-right font-semibold text-ink">
                        {item.total_stok}
                      </td>
                      <td className="td text-right">
                        {hasWarna ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItem(item.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface hover:bg-subtle px-2.5 py-1 text-[11px] font-medium text-muted hover:text-ink transition-colors cursor-pointer"
                          >
                            <span>{item.rincian_warna.length} warna</span>
                            <ChevronDown
                              className={`size-3.5 text-faint transition-transform ${
                                isExpanded ? "rotate-180 text-ink" : ""
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="text-[11px] text-faint">-</span>
                        )}
                      </td>
                    </tr>

                    {isExpanded && hasWarna && (
                      <tr className="bg-surface/70">
                        <td colSpan={colSpan} className="px-4 py-3 border-b border-line">
                          <div className="flex flex-wrap gap-2 pl-6 sm:pl-10">
                            {item.rincian_warna.map((wItem, wIdx) => (
                              <div
                                key={wIdx}
                                className="inline-flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs"
                              >
                                <span className="text-muted capitalize">
                                  {wItem.warna}
                                </span>
                                <span className="font-semibold text-ink">
                                  {wItem.qty}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
