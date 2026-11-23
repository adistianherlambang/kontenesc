"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  Circle,
  Cloud,
  CloudOff,
  X,
  Copy,
  RefreshCw,
} from "lucide-react";
import { LajulBrandDoc, LajulMetrics } from "@/lib/firebase";
import CopyLajulModal from "@/components/CopyLajulModal";

export type LajulStatusView = "all" | "sold" | "nosell";

interface LajulSidebarProps {
  activeView: LajulStatusView;
  onSelectView: (view: LajulStatusView) => void;
  totalBrandsCount: number;
  soldBrandsCount: number;
  noSellBrandsCount: number;
  brands: LajulBrandDoc[];
  selectedBrand: string;
  onSelectBrand: (brandKey: string) => void;
  totalTxCount: number;
  metrics?: LajulMetrics;
  tanggal?: string;
  firebaseStatus: "connected" | "offline" | "syncing";
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function LajulSidebar({
  activeView,
  onSelectView,
  totalBrandsCount,
  soldBrandsCount,
  noSellBrandsCount,
  brands,
  selectedBrand,
  onSelectBrand,
  totalTxCount,
  metrics,
  tanggal,
  firebaseStatus,
  onRefresh,
  isRefreshing = false,
  isOpenMobile,
  onCloseMobile,
}: LajulSidebarProps) {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  const views: {
    id: LajulStatusView;
    label: string;
    icon: typeof Layers;
    count: number;
  }[] = [
    { id: "all", label: "Semua brand", icon: Layers, count: totalBrandsCount },
    {
      id: "sold",
      label: "Ada penjualan",
      icon: CheckCircle2,
      count: soldBrandsCount,
    },
    { id: "nosell", label: "No sell", icon: Circle, count: noSellBrandsCount },
  ];

  const pick = (fn: () => void) => () => {
    fn();
    onCloseMobile();
  };

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
              <p className="truncate text-xs text-muted">Laporan Penjualan</p>
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
            <p className="section-label">Status</p>
            <div className="space-y-1">
              {views.map(({ id, label, icon: Icon, count }) => (
                <button
                  type="button"
                  key={id}
                  data-active={activeView === id}
                  onClick={pick(() => onSelectView(id))}
                  className="nav-item"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  <span className="nav-count">{count}</span>
                </button>
              ))}
            </div>
          </nav>

          <nav>
            <p className="section-label">Brand</p>
            <div className="space-y-1">
              <button
                type="button"
                data-active={selectedBrand === "Semua"}
                onClick={pick(() => onSelectBrand("Semua"))}
                className="nav-item"
              >
                <span className="size-2.5 shrink-0 rounded-full bg-line-strong" />
                <span className="truncate">Semua brand</span>
                <span className="nav-count">{totalTxCount}</span>
              </button>

              {brands.map((b) => {
                const txCount = b.transaksi?.length || 0;
                const isSold = !b.no_sell && txCount > 0;
                return (
                  <button
                    type="button"
                    key={b.brand_key}
                    data-active={selectedBrand === b.brand_key}
                    onClick={pick(() => onSelectBrand(b.brand_key))}
                    className="nav-item"
                  >
                    <span
                      className={`size-2.5 shrink-0 rounded-full ring-1 ring-black/10 ${
                        isSold ? "bg-success" : "bg-line-strong"
                      }`}
                    />
                    <span className="truncate flex-1 text-left">
                      {b.brand_name}
                    </span>
                    <span className="nav-count">{txCount}</span>
                  </button>
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
                <span className="truncate">Copy Laporan WhatsApp</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Footer — matches /konten Sidebar footer */}
        <div className="shrink-0 space-y-3 border-t border-line p-3">
          {metrics && (
            <div className="px-2.5 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted">
                  Unit terjual
                </span>
                <span className="text-xs font-semibold text-ink">
                  {metrics.unit_terjual} unit
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted">
                  Total payment
                </span>
                <span className="text-xs font-semibold text-ink">
                  {metrics.total_payment}
                </span>
              </div>
              {tanggal && (
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-faint">Tanggal</span>
                  <span className="text-[11px] text-muted">{tanggal}</span>
                </div>
              )}
            </div>
          )}

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
        <CopyLajulModal
          isOpen={true}
          onClose={() => setIsCopyModalOpen(false)}
          brands={brands}
          metrics={metrics}
          tanggal={tanggal}
          defaultBrand={selectedBrand}
          activeView={activeView}
        />
      )}
    </>
  );
}
