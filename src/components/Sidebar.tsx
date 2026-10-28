"use client";

import React from "react";
import { 
  FileText, 
  Clock, 
  CheckSquare, 
  Cloud, 
  X
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
  categories: { name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
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
  onCloseMobile,
  categories,
  selectedCategory,
  onSelectCategory
}: SidebarProps) {
  const percent = totalCount > 0 ? Math.round((executedCount / totalCount) * 100) : 0;

  const views = [
    {
      id: "all",
      label: "Semua Konten",
      icon: FileText,
      count: totalCount
    },
    {
      id: "pending",
      label: "Belum Eksekusi",
      icon: Clock,
      count: pendingCount,
      color: "text-amber-600"
    },
    {
      id: "executed",
      label: "Sudah Eksekusi",
      icon: CheckSquare,
      count: executedCount,
      color: "text-emerald-600"
    }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-60 bg-[#FAFAFA] border-r border-[#ECEBE8]
        flex flex-col justify-between shrink-0 h-full
        transition-transform duration-200 ease-in-out
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Top Controls & Navigation */}
        <div className="p-5 overflow-y-auto">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ECEBE8]">
            <div>
              <h1 className="text-sm font-bold text-[#18181B] tracking-tight">
                Semarang Cell
              </h1>
              <p className="text-[11px] text-[#A1A1AA]">
                Konten Hub & Brief
              </p>
            </div>

            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Nav */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-[#A1A1AA] tracking-wider uppercase px-2 mb-2">
              Status Konten
            </p>
            <nav className="space-y-1">
              {views.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectView(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors select-none cursor-pointer ${
                      isActive 
                        ? "bg-[#18181B] text-white font-semibold shadow-2xs" 
                        : "text-[#71717A] hover:bg-[#F2F2F4] hover:text-[#18181B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : item.color || "text-[#71717A]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && (
                      <span className={`text-[10.5px] font-mono px-1.5 py-0.2 rounded-md ${
                        isActive ? "bg-white/20 text-white" : "text-gray-400 bg-gray-100"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Categories Nav */}
          {categories.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#A1A1AA] tracking-wider uppercase px-2 mb-2">
                Kategori
              </p>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onSelectCategory("Semua");
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors select-none cursor-pointer ${
                    selectedCategory === "Semua" 
                      ? "bg-gray-200 text-[#18181B] font-semibold" 
                      : "text-[#71717A] hover:bg-[#F2F2F4] hover:text-[#18181B]"
                  }`}
                >
                  <span className="truncate">Semua Kategori</span>
                  <span className="text-[10px] text-gray-400 font-mono">{totalCount}</span>
                </button>
                {categories.map((c) => {
                  const isActive = selectedCategory === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => {
                        onSelectCategory(c.name);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors select-none cursor-pointer ${
                        isActive 
                          ? "bg-gray-200 text-[#18181B] font-semibold" 
                          : "text-[#71717A] hover:bg-[#F2F2F4] hover:text-[#18181B]"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{c.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-[#ECEBE8] bg-[#FAFAFA]">
          {/* Progress Indicator */}
          <div className="mb-3 px-3 py-2 rounded-xl bg-white border border-[#ECEBE8]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#71717A] mb-1">
              <span>Eksekusi</span>
              <span className="font-mono text-[#18181B]">{percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[10px] text-[#A1A1AA] mt-1 font-medium">
              {executedCount} dari {totalCount} tuntas
            </p>
          </div>

          <button
            onClick={onOpenSyncModal}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-[#71717A] hover:bg-white hover:text-[#18181B] transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Status Cloud Firebase</span>
            </div>
            <span className="flex items-center gap-1.5 text-[9.5px] font-mono">
              {firebaseStatus === "connected" ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
