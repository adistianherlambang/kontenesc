"use client";

import React from "react";
import { 
  FileText, 
  CheckSquare, 
  Clock, 
  BarChart2,
  FolderKanban
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface StatsCardsProps {
  items: ContentItem[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export default function StatsCards({
  items,
  activeFilter = "all",
  onFilterChange
}: StatsCardsProps) {
  const total = items.length;
  const executed = items.filter(i => Boolean(i.executed)).length;
  const pending = total - executed;
  const percent = total > 0 ? Math.round((executed / total) * 100) : 0;
  const categoriesCount = new Set(items.map(i => i.kategori)).size;

  const stats = [
    {
      label: "Total Konten",
      value: total,
      sub: `${categoriesCount} kategori brief`,
      icon: FileText,
      key: "all"
    },
    {
      label: "Selesai Eksekusi",
      value: executed,
      sub: `${percent}% telah selesai`,
      icon: CheckSquare,
      key: "executed",
      highlight: "text-emerald-600"
    },
    {
      label: "Belum Eksekusi",
      value: pending,
      sub: "Perlu dibuat & dipost",
      icon: Clock,
      key: "pending",
      highlight: "text-amber-600"
    },
    {
      label: "Progress Keseluruhan",
      value: `${percent}%`,
      sub: `${executed} dari ${total} konten`,
      icon: BarChart2,
      key: "progress"
    },
    {
      label: "Kategori Produk",
      value: categoriesCount,
      sub: "iPhone, iPad, Watch, dll",
      icon: FolderKanban,
      key: "categories"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = activeFilter === stat.key;
        return (
          <div
            key={stat.label}
            onClick={() => onFilterChange && onFilterChange(stat.key)}
            className={`p-3.5 rounded-lg border bg-white transition-all select-none ${
              onFilterChange ? "cursor-pointer hover:border-gray-300 hover:shadow-xs" : ""
            } ${
              isActive 
                ? "border-gray-900 ring-1 ring-gray-900 bg-gray-50/50" 
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500">
                {stat.label}
              </span>
              <div className="w-6 h-6 rounded flex items-center justify-center text-gray-500 bg-gray-100">
                <Icon className={`w-3.5 h-3.5 ${stat.highlight || ""}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold tracking-tight ${stat.highlight || "text-gray-900"}`}>
                {stat.value}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 truncate">
              {stat.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}

