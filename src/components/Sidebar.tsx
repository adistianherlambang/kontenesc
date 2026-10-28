"use client";

import React from "react";
import { Layers, Circle, CheckCircle2, Cloud, CloudOff, X } from "lucide-react";
import { getCategoryTone } from "@/lib/categoryTone";

export type StatusView = "all" | "pending" | "executed";

interface SidebarProps {
  activeView: StatusView;
  onSelectView: (view: StatusView) => void;
  totalCount: number;
  pendingCount: number;
  executedCount: number;
  categories: { name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  firebaseStatus: "connected" | "offline" | "syncing";
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  activeView,
  onSelectView,
  totalCount,
  pendingCount,
  executedCount,
  categories,
  selectedCategory,
  onSelectCategory,
  firebaseStatus,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const percent = totalCount > 0 ? Math.round((executedCount / totalCount) * 100) : 0;

  const views: { id: StatusView; label: string; icon: typeof Layers; count: number }[] = [
    { id: "all", label: "Semua konten", icon: Layers, count: totalCount },
    { id: "pending", label: "Belum dieksekusi", icon: Circle, count: pendingCount },
    { id: "executed", label: "Sudah dieksekusi", icon: CheckCircle2, count: executedCount },
  ];

  const pick = (fn: () => void) => () => {
    fn();
    onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div onClick={onCloseMobile} className="fixed inset-0 z-40 bg-ink/30 md:hidden" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-line bg-surface
          transition-transform duration-200 md:static md:translate-x-0
          ${isOpenMobile ? "translate-x-0 pointer-events-auto" : "-translate-x-full max-md:pointer-events-none md:pointer-events-auto"}`}
      >
        {/* Brand — same height as the main header so the borders line up */}
        <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-line px-4 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Semarang Cell</p>
            <p className="truncate text-xs text-muted">Konten Instagram</p>
          </div>
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
            <p className="section-label">Kategori</p>
            <div className="space-y-1">
              <button
                type="button"
                data-active={selectedCategory === "Semua"}
                onClick={pick(() => onSelectCategory("Semua"))}
                className="nav-item"
              >
                <span className="size-2.5 shrink-0 rounded-full bg-line-strong" />
                <span className="truncate">Semua kategori</span>
                <span className="nav-count">{totalCount}</span>
              </button>
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.name}
                  data-active={selectedCategory === c.name}
                  onClick={pick(() => onSelectCategory(c.name))}
                  className="nav-item"
                  title={c.name}
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${getCategoryTone(c.name).dot}`} />
                  <span className="truncate">{c.name}</span>
                  <span className="nav-count">{c.count}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Footer: progress + data/sync */}
        <div className="shrink-0 space-y-3 border-t border-line p-3">
          <div className="px-2.5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted">Progres eksekusi</span>
              <span className="text-xs text-ink">
                {executedCount}/{totalCount}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-2.5 py-1 text-xs text-muted select-none">
            {firebaseStatus === "connected" ? (
              <Cloud className="size-4 shrink-0 text-success" />
            ) : (
              <CloudOff className="size-4 shrink-0" />
            )}
            <span className="truncate">Status sinkronisasi</span>
            <span className="ml-auto text-[11px] text-faint">
              {firebaseStatus === "connected" ? "Cloud" : firebaseStatus === "syncing" ? "…" : "Lokal"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
