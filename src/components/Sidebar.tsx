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
        w-64 lg:w-70 bg-white border-r border-[#ECEBE8]
        flex flex-col justify-between shrink-0 h-full
        transition-transform duration-200 ease-in-out
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Top Controls & Navigation */}
        <div className="p-6 overflow-y-auto">
          {/* macOS Traffic Lights + Window controls */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block shadow-2xs" />
              <button 
                className="ml-2.5 text-[#A1A1AA] hover:text-[#52525B] transition-colors hidden sm:block cursor-pointer"
                title="Sidebar"
              >
                <SidebarIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile matching reference */}
          <div className="flex items-center gap-3.5 px-1 mb-8 select-none">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F4F5] border border-black/5 flex items-center justify-center text-xl shadow-2xs shrink-0">
              🐼
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-[#18181B] truncate tracking-tight leading-snug">
                Anastasia
              </h2>
              <p className="text-[12px] text-[#A1A1AA] truncate font-normal">
                anastasia@icylab.co
              </p>
            </div>
          </div>

          {/* MAIN Section */}
          <div className="mb-7">
            <p className="text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase px-3 mb-2">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors select-none cursor-pointer ${
                      isActive 
                        ? "bg-[#EAEAEA] text-[#18181B] font-semibold shadow-2xs" 
                        : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#18181B]" : "text-[#71717A]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && (
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
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
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase px-3 mb-2">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors select-none cursor-pointer ${
                      isActive 
                        ? "bg-[#EAEAEA] text-[#18181B] font-semibold shadow-2xs" 
                        : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#18181B]" : "text-[#71717A]"}`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === "number" && (
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
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
        <div className="p-6 pt-4 border-t border-[#ECEBE8] bg-white">
          {/* Progress Indicator */}
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#ECEBE8]">
            <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#71717A] mb-1.5">
              <span>Progress Eksekusi</span>
              <span className="font-mono text-[#18181B]">{percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div 
                className="h-full bg-[#1F6FB6] rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[10px] text-[#A1A1AA] mt-1 font-medium">
              {executedCount} dari {totalCount} selesai
            </p>
          </div>

          <p className="text-[11px] font-semibold text-[#A1A1AA] tracking-wider uppercase px-3 mb-1.5">
            SETTINGS
          </p>
          <div className="space-y-1">
            <button
              onClick={onOpenSyncModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-4 h-4 text-[#71717A]" />
                <span>Settings</span>
              </div>
            </button>

            <button
              onClick={onOpenSyncModal}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Cloud className="w-4 h-4 text-[#71717A]" />
                <span>Sync Status</span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono">
                {firebaseStatus === "connected" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
