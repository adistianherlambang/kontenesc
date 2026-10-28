"use client";

import React from "react";
import { 
  PenLine, 
  Bookmark, 
  Clock, 
  Tag, 
  BookOpen, 
  LayoutGrid, 
  Share2, 
  Settings as SettingsIcon, 
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
      icon: PenLine,
      count: totalCount
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: Bookmark
    },
    {
      id: "pending",
      label: "Recent notes",
      icon: Clock,
      count: pendingCount
    },
    {
      id: "tags",
      label: "Tags",
      icon: Tag
    }
  ];

  const orderNav = [
    {
      id: "notebooks",
      label: "Notebooks",
      icon: BookOpen
    },
    {
      id: "projects",
      label: "Projects",
      icon: LayoutGrid
    },
    {
      id: "shared",
      label: "Shared",
      icon: Share2,
      count: executedCount
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
        w-[220px] bg-[#FAFAFA] border-r border-[#ECEBE8]
        flex flex-col justify-between shrink-0 h-full
        transition-transform duration-200 ease-in-out
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Top Controls & Navigation */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          {/* macOS Traffic Lights */}
          <div className="flex items-center justify-between mb-5 px-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block shadow-2xs" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block shadow-2xs" />
            </div>

            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile matching reference */}
          <div className="flex items-center gap-2.5 px-0.5 mb-6 select-none">
            <div className="w-9 h-9 rounded-xl bg-white border border-black/5 flex items-center justify-center text-lg shadow-2xs shrink-0">
              🐼
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[13.5px] font-bold text-[#18181B] truncate tracking-tight leading-snug">
                Anastasia
              </h2>
              <p className="text-[11px] text-[#A1A1AA] truncate font-normal">
                anastasia@icylab.co
              </p>
            </div>
          </div>

          {/* MAIN Section */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-[#A1A1AA] tracking-wider uppercase px-2.5 mb-1.5">
              MAIN
            </p>
            <nav className="space-y-0.5">
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors select-none cursor-pointer ${
                      isActive 
                        ? "bg-[#EAEAEA] text-[#18181B] font-semibold shadow-2xs" 
                        : "text-[#71717A] hover:bg-[#F2F2F4] hover:text-[#18181B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#18181B]" : "text-[#71717A]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white text-gray-900 shadow-2xs" : "text-gray-400"
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
          <div className="mb-5">
            <p className="text-[10px] font-bold text-[#A1A1AA] tracking-wider uppercase px-2.5 mb-1.5">
              ORDER
            </p>
            <nav className="space-y-0.5">
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors select-none cursor-pointer ${
                      isActive 
                        ? "bg-[#EAEAEA] text-[#18181B] font-semibold shadow-2xs" 
                        : "text-[#71717A] hover:bg-[#F2F2F4] hover:text-[#18181B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#18181B]" : "text-[#71717A]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white text-gray-900 shadow-2xs" : "text-gray-400"
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

        {/* SETTINGS Section */}
        <div className="p-4 pt-3 border-t border-[#ECEBE8] bg-[#FAFAFA]">
          {/* Progress Indicator */}
          <div className="mb-3 px-2.5 py-2 rounded-lg bg-white border border-[#ECEBE8]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#71717A] mb-1">
              <span>Progress Eksekusi</span>
              <span className="font-mono text-[#18181B]">{percent}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-gray-200 overflow-hidden">
              <div 
                className="h-full bg-[#1F6FB6] rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[9.5px] text-[#A1A1AA] mt-1 font-medium">
              {executedCount} dari {totalCount} selesai
            </p>
          </div>

          <p className="text-[10px] font-bold text-[#A1A1AA] tracking-wider uppercase px-2.5 mb-1">
            SETTINGS
          </p>
          <div className="space-y-0.5">
            <button
              onClick={onOpenSyncModal}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium text-[#71717A] hover:bg-[#F2F2F4] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={onOpenSyncModal}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium text-[#71717A] hover:bg-[#F2F2F4] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Cloud className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Sync Status</span>
              </div>
              <span className="flex items-center gap-1.5 text-[9.5px] font-mono">
                {firebaseStatus === "connected" ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700">Cloud</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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
