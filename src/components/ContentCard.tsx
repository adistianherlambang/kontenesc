"use client";

import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Eye, 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  Plus, 
  CheckCircle2
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
}

// 6 Color Themes Matching Reference Image Exactly
function getCardTheme(category: string = "", no: number = 1) {
  const cat = category.toLowerCase();

  // 1. Pink Theme (like "Psychology" in reference)
  if (cat.includes("edukasi") || cat.includes("spesifikasi") || no % 6 === 1) {
    return {
      outerBg: "bg-[#FDECEF]",
      outerBorder: "border-[#FAD2DA]",
      headerText: "text-[#D13B63]",
      tag1: { label: "Studies 🌿", bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
      tag2: { label: "Edukasi 💡", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      boldHook: "Poin Edukasi:"
    };
  }

  // 2. Blue Theme (like "Groceries" in reference)
  if (cat.includes("iphone") || cat.includes("promo") || no % 6 === 2) {
    return {
      outerBg: "bg-[#EAF1FD]",
      outerBorder: "border-[#D1E1FC]",
      headerText: "text-[#2B66CC]",
      tag1: { label: "iPhone 📱", bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
      tag2: { label: "Promo 🔥", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      boldHook: "Detail Promo:"
    };
  }

  // 3. Warm Beige/Stone Theme (like "Thai Chicken" in reference)
  if (cat.includes("ipad") || cat.includes("macbook") || cat.includes("gadget") || no % 6 === 3) {
    return {
      outerBg: "bg-[#F4F3EF]",
      outerBorder: "border-[#E5E3DD]",
      headerText: "text-[#4D4B46]",
      tag1: { label: "Gadget 💻", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      tag2: { label: "Spesifikasi ⚙️", bg: "bg-[#F4F3EF]", text: "text-[#4D4B46]", border: "border-[#E5E3DD]" },
      boldHook: "Spesifikasi:"
    };
  }

  // 4. Sage Green Theme (like "Autumn is coming" in reference)
  if (cat.includes("watch") || cat.includes("lifestyle") || no % 6 === 4) {
    return {
      outerBg: "bg-[#EEF6ED]",
      outerBorder: "border-[#D5EAD3]",
      headerText: "text-[#3B7A38]",
      tag1: { label: "Watch ⌚", bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
      tag2: { label: "Lifestyle 🏃", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      boldHook: "Fitur Unggulan:"
    };
  }

  // 5. Amber/Peach Theme (Tips & Trik)
  if (cat.includes("tips") || cat.includes("trik") || no % 6 === 5) {
    return {
      outerBg: "bg-[#FDF3EA]",
      outerBorder: "border-[#F9DFC8]",
      headerText: "text-[#C76722]",
      tag1: { label: "Tips ⚡", bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
      tag2: { label: "Trik 💡", bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
      boldHook: "Tips Kunci:"
    };
  }

  // 6. Lavender/Lilac Theme
  return {
    outerBg: "bg-[#F6EFFE]",
    outerBorder: "border-[#EBDCFD]",
    headerText: "text-[#7E48C5]",
    tag1: { label: "Aksesoris ✨", bg: "bg-[#F6EFFE]", text: "text-[#7E48C5]", border: "border-[#EBDCFD]" },
    tag2: { label: "Semarang Cell 📱", bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
    boldHook: "Keterangan:"
  };
}

export default function ContentCard({
  item,
  onToggleExecuted,
  onEdit,
  onDelete,
  onPreview
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
      rounded-[26px] ${theme.outerBg} border ${theme.outerBorder}
      p-3.5 pb-4 flex flex-col justify-between transition-all duration-200
      hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] relative group
    `}>
      {/* Outer Header: Category Title (Left) + Actions & Checkbox (Right) */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <h4 className={`font-bold text-[17px] tracking-tight truncate ${theme.headerText}`}>
          {item.kategori || "Notes"}
        </h4>

        {/* Right Tools: Checkbox + Plus + Menu */}
        <div className="flex items-center gap-2">
          {/* Execution Checkbox */}
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
          </label>

          {/* Plus button */}
          <button
            onClick={() => onPreview(item)}
            className={`p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer ${theme.headerText}`}
            title="Pratinjau"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* More horizontal button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer ${theme.headerText}`}
              title="Menu Opsi"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div 
                className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-150 py-1 z-20 text-xs text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(item);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Edit Konten</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onPreview(item);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                  <span>Preview Feed</span>
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(item);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inner White Card */}
      <div 
        onClick={() => onPreview(item)}
        className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white cursor-pointer flex flex-col justify-between flex-1 transition-all group/inner hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
      >
        <div>
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold border ${theme.tag1.bg} ${theme.tag1.text} ${theme.tag1.border}`}>
              {theme.tag1.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold border ${theme.tag2.bg} ${theme.tag2.text} ${theme.tag2.border}`}>
              {theme.tag2.label}
            </span>
            <span className="ml-auto font-mono text-[11px] text-[#A1A1AA]">
              #{item.no}
            </span>
          </div>

          {/* Big Bold Title */}
          <h3 className={`text-[19px] sm:text-[21px] font-extrabold text-[#18181B] leading-[1.25] tracking-tight mb-1.5 transition-colors group-hover/inner:text-[#1F6FB6] ${
            isDone ? "line-through text-[#A1A1AA]" : ""
          }`}>
            {item.judul}
          </h3>

          {/* Subtitle */}
          <p className="text-[13px] text-[#A1A1AA] font-normal mb-3.5">
            Brief #{item.no} • {item.platform || "Instagram Carousel"}
          </p>

          {/* Formatted Body Content */}
          <div className="mb-3">
            <p className="font-bold text-[13px] text-[#18181B] mb-1">
              {theme.boldHook}
            </p>
            <p className="text-[13px] text-[#52525B] leading-[1.6] line-clamp-4 whitespace-pre-line">
              {item.copywriting || item.caption}
            </p>
          </div>

          {/* Ambience note */}
          {item.ambience && (
            <p className="text-[12px] text-[#71717A] italic line-clamp-2 mt-2 pt-2 border-t border-[#F4F4F5]">
              💡 {item.ambience}
            </p>
          )}
        </div>

        {/* Card Footer Bar */}
        <div className="pt-3.5 mt-3 border-t border-[#F4F4F5] flex items-center justify-between text-xs text-[#71717A]">
          <div>
            {isDone ? (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#2F7E41]">
                <CheckCircle2 className="w-4 h-4" />
                Sudah Dieksekusi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#A1A1AA]">
                Belum dieksekusi
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 text-[#A1A1AA] hover:text-[#1F6FB6] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
              title="Salin Copywriting"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2F7E41]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(item);
              }}
              className="p-1.5 text-[#A1A1AA] hover:text-[#1F6FB6] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
              title="Lihat Feed Mockup"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 text-[#A1A1AA] hover:text-[#C76722] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
