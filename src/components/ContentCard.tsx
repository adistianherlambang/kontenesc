"use client";

import React from "react";
import { ContentItem } from "@/lib/firebase";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
}

// 6 Color Themes Matching Reference Image (Cyclic by item.no for balanced variety)
const THEMES = [
  {
    outerBg: "bg-[#FDF0F3]",
    outerBorder: "border-[#FAD4DC]",
    headerText: "text-[#D13B63]",
    tag1: { bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
  },
  {
    outerBg: "bg-[#EFF5FE]",
    outerBorder: "border-[#D6E5FD]",
    headerText: "text-[#2463EB]",
    tag1: { bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
  },
  {
    outerBg: "bg-[#F7F5F0]",
    outerBorder: "border-[#E9E6DC]",
    headerText: "text-[#4A473F]",
    tag1: { bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
  },
  {
    outerBg: "bg-[#EFF7EE]",
    outerBorder: "border-[#D7EED5]",
    headerText: "text-[#2E7D32]",
    tag1: { bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
  },
  {
    outerBg: "bg-[#FEF5EB]",
    outerBorder: "border-[#FCE4CD]",
    headerText: "text-[#C2621C]",
    tag1: { bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
  },
  {
    outerBg: "bg-[#F8F2FE]",
    outerBorder: "border-[#EBDCFC]",
    headerText: "text-[#7C3AED]",
    tag1: { bg: "bg-[#F8F2FE]", text: "text-[#7C3AED]", border: "border-[#EBDCFC]" },
  }
];

export default function ContentCard({
  item,
  onToggleExecuted,
  onPreview
}: ContentCardProps) {
  const isDone = Boolean(item.executed);
  const themeIndex = (item.no - 1) % THEMES.length;
  const theme = THEMES[themeIndex >= 0 ? themeIndex : 0];

  return (
    <div className={`
      rounded-[24px] ${theme.outerBg} border ${theme.outerBorder}
      p-3.5 pb-4 flex flex-col justify-between transition-all duration-200
      hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] relative group w-full
    `}>
      {/* Outer Header: Category Title + ONLY Checkbox */}
      <div className="flex items-center justify-between px-2 mb-3">
        <h4 className={`font-bold text-[15px] tracking-tight truncate ${theme.headerText}`}>
          {item.kategori || "Konten"}
        </h4>

        {/* Checkbox Centang Eksekusi (Clean, no extra buttons) */}
        <label 
          className="flex items-center gap-1.5 cursor-pointer select-none"
          title={isDone ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isDone}
            onChange={() => onToggleExecuted(item)}
            className="notion-checkbox cursor-pointer"
          />
          <span className={`text-[11px] font-semibold ${isDone ? "text-emerald-700" : "text-gray-400"}`}>
            {isDone ? "Tuntas" : "Eksekusi"}
          </span>
        </label>
      </div>

      {/* Inner White Card: Clickable to view/edit details */}
      <div 
        onClick={() => onPreview(item)}
        className="bg-white rounded-[18px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-white cursor-pointer flex flex-col justify-between flex-1 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
      >
        <div>
          {/* Header info */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border ${theme.tag1.bg} ${theme.tag1.text} ${theme.tag1.border}`}>
              {item.platform || "Instagram Feed"}
            </span>
            <span className="font-mono text-[11px] text-[#A1A1AA] font-semibold">
              #{item.no}
            </span>
          </div>

          {/* Big Bold Title */}
          <h3 className={`text-[17px] sm:text-[18px] font-extrabold text-[#111111] leading-[1.3] tracking-tight mb-3 transition-colors ${
            isDone ? "line-through text-[#A1A1AA]" : ""
          }`}>
            {item.judul}
          </h3>

          {/* Copywriting */}
          <div className="text-[12.5px] text-[#48484A] leading-[1.65] line-clamp-4 font-normal whitespace-pre-line mb-3">
            {item.copywriting || item.caption}
          </div>

          {/* Ambience visual note */}
          {item.ambience && (
            <p className="text-[11.5px] text-[#71717A] italic line-clamp-2 pt-2.5 border-t border-[#F2F2F7] leading-relaxed">
              💡 {item.ambience}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
