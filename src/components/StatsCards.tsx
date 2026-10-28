"use client";

import React from "react";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Edit3, 
  Layers,
  Send
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface StatsCardsProps {
  items: ContentItem[];
  activeFilterStatus: string;
  onFilterStatus: (status: string) => void;
}

export default function StatsCards({
  items,
  activeFilterStatus,
  onFilterStatus
}: StatsCardsProps) {
  const total = items.length;
  const siapTayang = items.filter(i => (i.status || "Siap Tayang") === "Siap Tayang").length;
  const terjadwal = items.filter(i => i.status === "Terjadwal").length;
  const draft = items.filter(i => i.status === "Draft").length;
  const sudahTayang = items.filter(i => i.status === "Sudah Tayang").length;
  
  const categoriesCount = new Set(items.map(i => i.kategori)).size;

  const stats = [
    {
      label: "Total Konten",
      value: total,
      sub: `${categoriesCount} Kategori`,
      icon: FileText,
      color: "from-blue-600 to-[#1F6FB6]",
      textColor: "text-blue-600",
      statusKey: "Semua"
    },
    {
      label: "Siap Tayang",
      value: siapTayang,
      sub: "Brief & copy tuntas",
      icon: CheckCircle,
      color: "from-emerald-600 to-teal-600",
      textColor: "text-emerald-600",
      statusKey: "Siap Tayang"
    },
    {
      label: "Terjadwal",
      value: terjadwal,
      sub: "Menunggu giliran post",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-600",
      statusKey: "Terjadwal"
    },
    {
      label: "Draft",
      value: draft,
      sub: "Perlu ditinjau",
      icon: Edit3,
      color: "from-slate-500 to-gray-600",
      textColor: "text-slate-600",
      statusKey: "Draft"
    },
    {
      label: "Sudah Tayang",
      value: sudahTayang,
      sub: "Live di Instagram",
      icon: Send,
      color: "from-indigo-500 to-violet-600",
      textColor: "text-indigo-600",
      statusKey: "Sudah Tayang"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isActive = activeFilterStatus === stat.statusKey;
        return (
          <button
            key={stat.label}
            onClick={() => onFilterStatus(stat.statusKey)}
            className={`text-left p-3.5 sm:p-4 rounded-xl border bg-white transition-all cursor-pointer relative overflow-hidden group ${
              isActive 
                ? "border-[#1F6FB6] ring-2 ring-blue-500/20 shadow-md bg-blue-50/20" 
                : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">
                {stat.label}
              </span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                item
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {stat.sub}
            </p>
          </button>
        );
      })}
    </div>
  );
}
