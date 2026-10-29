"use client";

import React from "react";
import { 
  Search, 
  X, 
  Table, 
  LayoutGrid, 
  Smartphone, 
  CheckSquare, 
  Clock, 
  ListFilter,
  ArrowUpDown
} from "lucide-react";
import CustomSelect from "./CustomSelect";

interface FilterBarProps {
  activeTab: "all" | "pending" | "executed" | "gallery" | "simulator";
  onTabChange: (tab: "all" | "pending" | "executed" | "gallery" | "simulator") => void;
  totalCount: number;
  pendingCount: number;
  executedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: { name: string; count: number }[];
  selectedPlatform: string;
  onSelectPlatform: (p: string) => void;
  sortBy: "no-asc" | "no-desc" | "title-asc";
  onSortChange: (sort: "no-asc" | "no-desc" | "title-asc") => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export default function FilterBar({
  activeTab,
  onTabChange,
  totalCount,
  pendingCount,
  executedCount,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  selectedPlatform,
  onSelectPlatform,
  sortBy,
  onSortChange,
  onResetFilters,
  hasActiveFilters
}: FilterBarProps) {
  return (
    <div className="border-b border-[#E9E9E7] pb-2 mb-4 space-y-2.5">
      {/* 1. Notion Database View Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-b border-[#E9E9E7] -mb-[1px]">
        
        {/* All Items (Table) */}
        <button
          onClick={() => onTabChange("all")}
          className={`notion-btn pb-2 px-2.5 rounded-none text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "all"
              ? "border-[#37352F] text-[#37352F] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]"
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Tabel Database</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#EFEFED] text-[#5A5A58] rounded">
            {totalCount}
          </span>
        </button>

        {/* Pending Items */}
        <button
          onClick={() => onTabChange("pending")}
          className={`notion-btn pb-2 px-2.5 rounded-none text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "pending"
              ? "border-[#D9730D] text-[#D9730D] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Belum Eksekusi</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#FAEBDD] text-[#D9730D] rounded font-semibold">
            {pendingCount}
          </span>
        </button>

        {/* Executed Items */}
        <button
          onClick={() => onTabChange("executed")}
          className={`notion-btn pb-2 px-2.5 rounded-none text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "executed"
              ? "border-[#2B7830] text-[#2B7830] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]"
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-[#2B7830]" />
          <span>Selesai Eksekusi</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#E7F3E8] text-[#2B7830] rounded font-semibold">
            {executedCount}
          </span>
        </button>

        {/* Gallery View */}
        <button
          onClick={() => onTabChange("gallery")}
          className={`notion-btn pb-2 px-2.5 rounded-none text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "gallery"
              ? "border-[#37352F] text-[#37352F] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Galeri Kartu</span>
        </button>

        {/* IG Simulator */}
        <button
          onClick={() => onTabChange("simulator")}
          className={`notion-btn pb-2 px-2.5 rounded-none text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "simulator"
              ? "border-[#1F6FB6] text-[#1F6FB6] font-semibold"
              : "border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Feed Simulator</span>
        </button>
      </div>

      {/* 2. Notion Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#9B9A97] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari ide, teks visual, atau caption..."
            className="w-full pl-8 pr-7 py-1 text-xs rounded border border-[#E9E9E7] bg-[#F7F6F3] text-[#37352F] focus:bg-white focus:outline-none focus:border-[#1F6FB6] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9B9A97] hover:text-[#37352F]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Category Dropdown */}
          <div className="min-w-[140px]">
            <CustomSelect
              value={selectedCategory}
              onChange={onSelectCategory}
              options={[
                { value: "Semua", label: "Semua Kategori" },
                ...categories.map((c) => ({
                  value: c.name,
                  label: `${c.name} (${c.count})`,
                })),
              ]}
              triggerClassName="py-1 px-2.5 min-h-[32px] sm:min-h-[32px] text-xs"
            />
          </div>

          {/* Platform Dropdown */}
          <div className="min-w-[140px]">
            <CustomSelect
              value={selectedPlatform}
              onChange={onSelectPlatform}
              options={[
                { value: "Semua", label: "Semua Format" },
                { value: "Instagram Feed", label: "Instagram Feed" },
                { value: "Instagram Carousel", label: "Instagram Carousel" },
                { value: "Instagram Reels", label: "Instagram Reels" },
                { value: "Instagram Story", label: "Instagram Story" },
              ]}
              triggerClassName="py-1 px-2.5 min-h-[32px] sm:min-h-[32px] text-xs"
            />
          </div>

          {/* Sort */}
          <div className="min-w-[130px]">
            <CustomSelect
              value={sortBy}
              onChange={(val) => onSortChange(val as any)}
              options={[
                { value: "no-asc", label: "No: 1 → 60" },
                { value: "no-desc", label: "No: 60 → 1" },
                { value: "title-asc", label: "Judul: A → Z" },
              ]}
              triggerClassName="py-1 px-2.5 min-h-[32px] sm:min-h-[32px] text-xs"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs text-[#DF5452] hover:bg-[#FDEBEC] px-2 py-1 rounded transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
