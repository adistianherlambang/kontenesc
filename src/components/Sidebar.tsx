"use client";

import React from "react";
import { 
  PenTool, 
  Bookmark, 
  Clock, 
  Tag, 
  BookOpen, 
  FolderKanban, 
  Share2, 
  Settings, 
  Cloud, 
  CheckCircle2, 
  AlertCircle,
  X,
  Sidebar as SidebarIcon
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  totalCount: number;
  pendingCount: number;
  executedCount: number;
  firebaseStatus: "connected" | "offline" | "syncing";
  onOpenSyncModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  activeView,
  onSelectView,
  totalCount,
  pendingCount,
  executedCount,
  firebaseStatus,
  onOpenSyncModal,
  isOpenMobile,
  onCloseMobile
}: SidebarProps) {
  const percent = totalCount > 0 ? Math.round((executedCount / totalCount) * 100) : 0;

  const mainNav = [
    {
      id: "all",
      label: "All notes",
      indonesian: "Semua Konten",
      icon: PenTool,
      count: totalCount
    },
    {
      id: "favorites",
      label: "Favorites",
      indonesian: "Prioritas Promo",
      icon: Bookmark
    },
    {
      id: "pending",
      label: "Recent notes",
      indonesian: "Belum Eksekusi",
      icon: Clock,
      count: pendingCount
    },
    {
      id: "tags",
      label: "Tags",
      indonesian: "Kategori Produk",
      icon: Tag
    }
  ];

  const orderNav = [
    {
      id: "feed",
      label: "Notebooks",
      indonesian: "Instagram Feed",
      icon: BookOpen
    },
    {
      id: "reels",
      label: "Projects",
      indonesian: "Reels & Carousel",
      icon: FolderKanban
    },
    {
      id: "executed",
      label: "Shared",
      indonesian: "Sudah Eksekusi",
      icon: Share2,
      count: executedCount
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 lg:w-72 bg-white/95 md:bg-white border-r border-[#EAE9E4]
        flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Top Header & Window Controls */}
        <div className="p-4 sm:p-5">
          {/* macOS Traffic Lights */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block shadow-2xs" />
              <button 
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
                title="Sidebar"
              >
                <SidebarIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile close button */}
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile / Workspace Badge */}
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-gray-50/70 border border-gray-100/80 mb-6 select-none">
            <div className="w-11 h-11 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center text-xl shadow-2xs shrink-0">
              🐼
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-gray-900 truncate tracking-tight">
                Semarang Cell
              </h2>
              <p className="text-[11px] text-gray-400 truncate font-normal">
                konten@semarangcell.id
              </p>
            </div>
          </div>

          {/* MAIN Section */}
          <div className="mb-6">
            <p className="text-[11px] font-bold text-[#A3A19C] tracking-wider uppercase px-2.5 mb-2">
              MAIN
            </p>
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectView(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors select-none ${
                      isActive 
                        ? "bg-[#F0EFEA] text-gray-900 font-semibold shadow-2xs" 
                        : "text-[#706E6A] hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-[#8E8C87]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive ? "bg-white text-gray-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ORDER Section */}
          <div>
            <p className="text-[11px] font-bold text-[#A3A19C] tracking-wider uppercase px-2.5 mb-2">
              ORDER
            </p>
            <nav className="space-y-1">
              {orderNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectView(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors select-none ${
                      isActive 
                        ? "bg-[#F0EFEA] text-gray-900 font-semibold shadow-2xs" 
                        : "text-[#706E6A] hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-[#8E8C87]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive ? "bg-white text-gray-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* SETTINGS & Progress Section at Bottom */}
        <div className="p-4 border-t border-[#EAE9E4] bg-white">
          {/* Progress Mini Meter */}
          <div className="mb-4 p-3 rounded-xl bg-[#F7F6F3] border border-[#EAE9E4]">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-gray-700">Eksekusi Konten</span>
              <span className="font-mono text-gray-500 font-medium">{percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div 
                className="h-full bg-[#1F6FB6] rounded-full transition-all duration-300" 
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {executedCount} dari {totalCount} konten selesai
            </p>
          </div>

          <p className="text-[11px] font-bold text-[#A3A19C] tracking-wider uppercase px-2.5 mb-2">
            SETTINGS
          </p>
          <div className="space-y-1">
            <button
              onClick={onOpenSyncModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#706E6A] hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-[#8E8C87]" />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={onOpenSyncModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#706E6A] hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-[#8E8C87]" />
                <span>Sync Status</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono">
                {firebaseStatus === "connected" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700">Cloud</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-amber-700">Lokal</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
