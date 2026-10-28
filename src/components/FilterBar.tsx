"use client";

import React from "react";
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Smartphone, 
  ArrowUpDown,
  Filter
} from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: { name: string; count: number }[];
  selectedPlatform: string;
  onSelectPlatform: (p: string) => void;
  sortBy: "no-asc" | "no-desc" | "title-asc";
  onSortChange: (sort: "no-asc" | "no-desc" | "title-asc") => void;
  viewMode: "grid" | "table" | "preview";
  onViewModeChange: (mode: "grid" | "table" | "preview") => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  selectedPlatform,
  onSelectPlatform,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
  hasActiveFilters
}: FilterBarProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 space-y-3.5">
      {/* Top Row: Search + Sort + View Switches */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari judul, kata copywriting, ambience, atau isi caption..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FB6]/20 focus:border-[#1F6FB6] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls: Platform Filter + Sort + View Modes */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Platform Selector */}
          <select
            value={selectedPlatform}
            onChange={(e) => onSelectPlatform(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#1F6FB6]"
          >
            <option value="Semua">Semua Format</option>
            <option value="Instagram Feed">Feed Tunggal</option>
            <option value="Instagram Carousel">Carousel</option>
            <option value="Instagram Reels">Reels / Video</option>
            <option value="Instagram Story">Story</option>
          </select>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-transparent border-none text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="no-asc">No: 1 → 60</option>
              <option value="no-desc">No: 60 → 1</option>
              <option value="title-asc">Judul: A → Z</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-white text-[#1F6FB6] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white text-[#1F6FB6] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan Tabel Ringkas"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange("preview")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "preview"
                  ? "bg-white text-[#1F6FB6] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Simulator Feed Instagram"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Category Pills Scrollable */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
        <button
          onClick={() => onSelectCategory("Semua")}
          className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "Semua"
              ? "bg-[#1F6FB6] text-white shadow-sm shadow-blue-500/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Semua ({categories.reduce((a, b) => a + b.count, 0)})
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#1F6FB6] text-white shadow-sm shadow-blue-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
