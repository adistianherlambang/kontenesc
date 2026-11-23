"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Cloud,
  CloudOff,
  X,
  Copy,
  RefreshCw,
} from "lucide-react";
import { BrandLogo, BRAND_LIST } from "@/lib/brandLogos";
import { StokItem } from "@/lib/firebase";
import CopyStokModal from "@/components/CopyStokModal";

interface StokSidebarProps {
  activeBrand: string; // "all" or brand slug
  brandTotals: Record<string, number>;
  totalUnits: number;
  totalHpUnits?: number;
  totalAccUnits?: number;
  tanggal?: string;
  firebaseStatus: "connected" | "offline" | "syncing";
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  items?: StokItem[];
}

export default function StokSidebar({
  activeBrand,
  brandTotals,
  totalUnits,
  totalHpUnits,
  totalAccUnits,
  tanggal,
  firebaseStatus,
  onRefresh,
  isRefreshing = false,
  isOpenMobile,
  onCloseMobile,
  items = [],
}: StokSidebarProps) {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink/30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-line bg-surface
          transition-transform duration-200 md:static md:translate-x-0
          ${
            isOpenMobile
              ? "translate-x-0 pointer-events-auto"
              : "-translate-x-full max-md:pointer-events-none md:pointer-events-auto"
          }`}
      >
        {/* Brand — matches /konten Sidebar header */}
        <div className="flex min-h-14 sm:min-h-[62px] shrink-0 items-center justify-between border-b border-line px-4 sm:px-5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 group"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="size-4 shrink-0 text-muted group-hover:text-ink transition-colors" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                Semarang Cell
              </p>
              <p className="truncate text-xs text-muted">Stok Handphone</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="btn btn-ghost btn-icon md:hidden"
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <nav>
            <p className="section-label">Ringkasan</p>
            <div className="space-y-1">
              <Link
                href="/stok"
                data-active={activeBrand === "all"}
                onClick={onCloseMobile}
                className="nav-item"
              >
                <Smartphone className="size-4 shrink-0" />
                <span className="truncate">Semua brand</span>
                <span className="nav-count">{totalUnits}</span>
              </Link>
            </div>
          </nav>

          <nav>
            <p className="section-label">Brand</p>
            <div className="space-y-1">
              {BRAND_LIST.map(({ slug, name }) => {
                const count =
                  brandTotals[name] ??
                  brandTotals[slug] ??
                  brandTotals[slug.toUpperCase()] ??
                  0;
                const isActive = activeBrand.toLowerCase() === slug;

                return (
                  <Link
                    key={slug}
                    href={`/stok/${slug}`}
                    data-active={isActive}
                    onClick={onCloseMobile}
                    className="nav-item"
                  >
                    <BrandLogo
                      brand={slug}
                      color={slug === "infinix" ? "#2E9E00" : undefined}
                      className="h-3.5 w-auto max-w-[110px] shrink-0"
                    />
                    <span className="nav-count">{count}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <nav>
            <p className="section-label">Tools</p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  setIsCopyModalOpen(true);
                }}
                className="nav-item"
              >
                <Copy className="size-4 shrink-0" />
                <span className="truncate">Copy Stok WhatsApp</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Footer — matches /konten Sidebar footer */}
        <div className="shrink-0 space-y-3 border-t border-line p-3">
          <div className="px-2.5 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted">Total stok</span>
              <span className="text-xs font-semibold text-ink">
                {totalUnits} unit
              </span>
            </div>
            {typeof totalAccUnits === "number" && totalAccUnits > 0 && (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-faint">Handphone</span>
                  <span className="text-[11px] text-muted">
                    {totalHpUnits ?? Math.max(0, totalUnits - totalAccUnits)} unit
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-faint">ACC</span>
                  <span className="text-[11px] text-muted">
                    {totalAccUnits} unit
                  </span>
                </div>
              </>
            )}
            {tanggal && (
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-faint">Update</span>
                <span className="text-[11px] text-muted">{tanggal}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 text-xs text-muted select-none">
            {firebaseStatus === "connected" ? (
              <Cloud className="size-4 shrink-0 text-success" />
            ) : (
              <CloudOff className="size-4 shrink-0" />
            )}
            <span className="truncate">Status sinkronisasi</span>
            <span className="ml-auto text-[11px] text-faint">
              {firebaseStatus === "connected"
                ? "Cloud"
                : firebaseStatus === "syncing"
                ? "…"
                : "Lokal"}
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Muat ulang data dari server"
                aria-label="Muat ulang data dari server"
                className="p-1 -mr-1 rounded-md text-faint hover:text-ink hover:bg-subtle transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            )}
          </div>
        </div>
      </aside>

      {isCopyModalOpen && (
        <CopyStokModal
          isOpen={true}
          onClose={() => setIsCopyModalOpen(false)}
          items={items}
          tanggal={tanggal}
          defaultBrand={activeBrand}
        />
      )}
    </>
  );
}
