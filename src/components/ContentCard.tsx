"use client";

import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  Plus
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
  onAddContent?: () => void;
}

// 6 Color Themes Matching Reference Image Exactly
function getCardTheme(category: string = "", no: number = 1) {
  const cat = category.toLowerCase();

  // 1. Pink Theme ("Psychology" style)
  if (cat.includes("edukasi") || cat.includes("spesifikasi") || no % 5 === 1) {
    return {
      outerBg: "bg-[#FDECEF]",
      outerBorder: "border-[#FAD2DA]",
      headerText: "text-[#D13B63]",
      tag1: { label: "Studies 🌿", bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
      tag2: { label: "Edukasi 💡", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      boldHook: "Poin Edukasi:"
    };
  }

  // 2. Blue Theme ("Groceries" style)
  if (cat.includes("iphone") || cat.includes("promo") || no % 5 === 2) {
    return {
      outerBg: "bg-[#EAF1FD]",
      outerBorder: "border-[#D1E1FC]",
      headerText: "text-[#2B66CC]",
      tag1: { label: "Food 🍱", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      tag2: { label: "iPhone 📱", bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
      boldHook: "Detail Promo:"
    };
  }

  // 3. Warm Stone/Gray Theme ("Thai Chicken" style)
  if (cat.includes("ipad") || cat.includes("macbook") || cat.includes("gadget") || no % 5 === 3) {
    return {
      outerBg: "bg-[#F4F3EF]",
      outerBorder: "border-[#E5E3DD]",
      headerText: "text-[#4D4B46]",
      tag1: { label: "Food 🍱", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      tag2: { label: "Gadget 💻", bg: "bg-[#F4F3EF]", text: "text-[#4D4B46]", border: "border-[#E5E3DD]" },
      boldHook: "Spesifikasi:"
    };
  }

  // 4. Sage Green Theme ("Autumn is coming" style)
  if (cat.includes("watch") || cat.includes("lifestyle") || no % 5 === 4) {
    return {
      outerBg: "bg-[#EEF6ED]",
      outerBorder: "border-[#D5EAD3]",
      headerText: "text-[#3B7A38]",
      tag1: { label: "Diary 📓", bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
      tag2: { label: "Thoughts 💭", bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
      boldHook: "Fitur Unggulan:"
    };
  }

  // 5. Peach/Amber Theme (Tips & Trik)
  return {
    outerBg: "bg-[#FDF3EA]",
    outerBorder: "border-[#F9DFC8]",
    headerText: "text-[#C76722]",
    tag1: { label: "Tips ⚡", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
    tag2: { label: "Hacks 💡", bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
    boldHook: "Tips Kunci:"
  };
}

export default function ContentCard({
  item,
  onToggleExecuted,
  onEdit,
  onDelete,
  onPreview,
  onAddContent
}: ContentCardProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isDone = Boolean(item.executed);
  const theme = getCardTheme(item.kategori, item.no);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.copywriting || item.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`
      rounded-[28px] ${theme.outerBg} border ${theme.outerBorder}
      pt-3.5 pb-4 px-3.5 flex flex-col justify-between transition-all duration-200
      hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] relative group
    `}>
      {/* Outer Header: Category Title + Checkbox + Plus + Menu */}
      <div className="flex items-center justify-between px-2 mb-3">
        <h4 className={`font-bold text-[17px] tracking-tight truncate ${theme.headerText}`}>
          {item.kategori || "Notes"}
        </h4>

        {/* Right Tools: Checkbox, Plus, Menu */}
        <div className="flex items-center gap-2.5">
          {/* Checkbox Centang Eksekusi */}
          <label 
            className="flex items-center cursor-pointer select-none"
            title={isDone ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isDone}
              onChange={() => onToggleExecuted(item)}
              className="notion-checkbox cursor-pointer"
            />
          </label>

          {/* Plus button to add note */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onAddContent) {
                onAddContent();
              }
            }}
            className={`p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer ${theme.headerText}`}
            title="Tambah Konten"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* More Horizontal (...) button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer ${theme.headerText}`}
              title="Menu Opsi"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div 
                className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-150 py-1.5 z-20 text-xs text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(item);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-100 flex items-center gap-2 font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Edit Konten</span>
                </button>
                <button
                  onClick={(e) => {
                    setShowMenu(false);
                    handleCopy(e);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-100 flex items-center gap-2 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#2F7E41]" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                  <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(item);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inner White Card: 100% Clean, matches reference image without noisy footer buttons */}
      <div 
        onClick={() => onPreview(item)}
        className="bg-white rounded-[22px] p-6 sm:p-6.5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] border border-white cursor-pointer flex flex-col justify-between flex-1 transition-all group/inner hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] min-h-[320px]"
      >
        <div>
          {/* Tag Badges with Emoji */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border ${theme.tag1.bg} ${theme.tag1.text} ${theme.tag1.border}`}>
              {theme.tag1.label}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border ${theme.tag2.bg} ${theme.tag2.text} ${theme.tag2.border}`}>
              {theme.tag2.label}
            </span>
            <span className="ml-auto font-mono text-[11px] text-[#A1A1AA] font-medium">
              #{item.no}
            </span>
          </div>

          {/* Big Bold Title */}
          <h3 className={`text-[21px] sm:text-[23px] font-extrabold text-[#18181B] leading-[1.25] tracking-tight mb-1.5 transition-colors group-hover/inner:text-[#1F6FB6] ${
            isDone ? "line-through text-[#A1A1AA]" : ""
          }`}>
            {item.judul}
          </h3>

          {/* Subtitle */}
          <p className="text-[13px] text-[#A1A1AA] font-normal mb-5">
            Week {item.no}, brief notes • {item.platform || "Instagram Feed"}
          </p>

          {/* Body Content */}
          <div className="mb-3">
            <p className="font-bold text-[13.5px] text-[#18181B] mb-1.5">
              {theme.boldHook}
            </p>
            <p className="text-[13px] text-[#4B4B52] leading-[1.65] line-clamp-5 whitespace-pre-line font-normal">
              {item.copywriting || item.caption}
            </p>
          </div>

          {/* Ambience note */}
          {item.ambience && (
            <p className="text-[12px] text-[#71717A] italic line-clamp-2 mt-3 pt-3 border-t border-[#F4F4F5] leading-relaxed">
              💡 {item.ambience}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
