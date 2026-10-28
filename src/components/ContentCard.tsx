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
  CheckCircle2,
  Share2
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
}

// Map categories to the 6 pastel color themes from the reference image
function getCategoryTheme(category: string = "") {
  const cat = category.toLowerCase();
  
  if (cat.includes("edukasi") || cat.includes("spesifikasi") || cat.includes("psychology")) {
    return {
      outerBg: "bg-[#FFF0F3]",
      outerBorder: "border-[#FDE2E6]",
      titleColor: "text-[#D6336C]",
      tagBg: "bg-pink-50",
      tagText: "text-pink-700",
      tagBorder: "border-pink-150",
      accent: "#D6336C",
      defaultEmoji: "💡",
      tagEmoji: "Edukasi 💡"
    };
  }
  
  if (cat.includes("iphone") || cat.includes("groceries") || cat.includes("promo")) {
    return {
      outerBg: "bg-[#EEF4FF]",
      outerBorder: "border-[#D7E4FE]",
      titleColor: "text-[#285BC7]",
      tagBg: "bg-blue-50",
      tagText: "text-blue-700",
      tagBorder: "border-blue-150",
      accent: "#285BC7",
      defaultEmoji: "📱",
      tagEmoji: "iPhone 📱"
    };
  }

  if (cat.includes("watch") || cat.includes("autumn") || cat.includes("lifestyle")) {
    return {
      outerBg: "bg-[#F0F8EE]",
      outerBorder: "border-[#DBECD7]",
      titleColor: "text-[#3B7A38]",
      tagBg: "bg-emerald-50",
      tagText: "text-emerald-700",
      tagBorder: "border-emerald-150",
      accent: "#3B7A38",
      defaultEmoji: "⌚",
      tagEmoji: "Watch ⌚"
    };
  }

  if (cat.includes("ipad") || cat.includes("macbook") || cat.includes("thai") || cat.includes("gadget")) {
    return {
      outerBg: "bg-[#F7F6F3]",
      outerBorder: "border-[#E9E7E0]",
      titleColor: "text-[#4D4B46]",
      tagBg: "bg-stone-50",
      tagText: "text-stone-700",
      tagBorder: "border-stone-200",
      accent: "#4D4B46",
      defaultEmoji: "💻",
      tagEmoji: "Gadget 💻"
    };
  }

  if (cat.includes("tips") || cat.includes("trik") || cat.includes("hacks")) {
    return {
      outerBg: "bg-[#FFF5EB]",
      outerBorder: "border-[#FDE2CA]",
      titleColor: "text-[#C2621C]",
      tagBg: "bg-amber-50",
      tagText: "text-amber-700",
      tagBorder: "border-amber-150",
      accent: "#C2621C",
      defaultEmoji: "⚡",
      tagEmoji: "Tips ⚡"
    };
  }

  // Fallback Lavender/Purple
  return {
    outerBg: "bg-[#F7F0FE]",
    outerBorder: "border-[#EADBFD]",
    titleColor: "text-[#7A45C2]",
    tagBg: "bg-purple-50",
    tagText: "text-purple-700",
    tagBorder: "border-purple-150",
    accent: "#7A45C2",
    defaultEmoji: "✨",
    tagEmoji: "Aksesoris ✨"
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
  const isDone = Boolean(item.executed);
  const theme = getCategoryTheme(item.kategori);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.copywriting || item.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Determine platform tag
  const platformLabel = item.platform || "Instagram Carousel";
  const platformEmoji = platformLabel.toLowerCase().includes("reels") ? "Reels 🎬" : "Carousel 📑";

  return (
    <div className={`
      rounded-[24px] ${theme.outerBg} border ${theme.outerBorder}
      p-3.5 pb-4 flex flex-col justify-between transition-all duration-200
      hover:shadow-md hover:-translate-y-0.5 group
    `}>
      {/* Outer Card Header (Category Title + Action Tools + Checkbox) */}
      <div className="flex items-center justify-between gap-2 px-1 mb-3">
        <h4 className={`font-bold text-base tracking-tight truncate ${theme.titleColor}`}>
          {item.kategori || "Konten"}
        </h4>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Checkbox Centang Eksekusi */}
          <label 
            className="flex items-center gap-1.5 cursor-pointer bg-white/70 hover:bg-white px-2 py-1 rounded-lg border border-black/5 transition-colors select-none"
            title={isDone ? "Tandai belum eksekusi" : "Tandai sudah eksekusi"}
          >
            <input
              type="checkbox"
              checked={isDone}
              onChange={() => onToggleExecuted(item)}
              className="notion-checkbox cursor-pointer"
            />
            <span className={`text-[11px] font-semibold ${isDone ? "text-emerald-700" : "text-gray-500"}`}>
              {isDone ? "Selesai" : "Eksekusi"}
            </span>
          </label>

          {/* Action Menu button */}
          <button
            onClick={() => onEdit(item)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-colors"
            title="Edit Konten"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inner White Card (Pure clean rounded card inside) */}
      <div 
        onClick={() => onPreview(item)}
        className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white cursor-pointer flex flex-col justify-between flex-1 group/inner hover:border-gray-200/60 transition-all"
      >
        <div>
          {/* Tag Badges with Emojis */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${theme.tagBg} ${theme.tagText} ${theme.tagBorder}`}>
              {theme.tagEmoji}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-150">
              {platformEmoji}
            </span>
            <span className="ml-auto font-mono text-[11px] text-gray-400">
              #{item.no}
            </span>
          </div>

          {/* Big Bold Modern Title */}
          <h3 className={`text-base sm:text-lg font-bold leading-snug tracking-tight mb-1 text-gray-900 group-hover/inner:text-[#1F6FB6] transition-colors ${
            isDone ? "line-through text-gray-400" : ""
          }`}>
            {item.judul}
          </h3>

          {/* Subtitle / Context */}
          <p className="text-xs text-gray-400 font-medium mb-3">
            Eldorado Semarang Cell Brief • {item.platform || "Instagram Feed"}
          </p>

          {/* Body Content / Copywriting Snippet */}
          <div className="text-xs text-gray-700 leading-relaxed font-sans mb-3 line-clamp-4 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
            {item.copywriting}
          </div>

          {/* Ambience note */}
          {item.ambience && (
            <p className="text-[11.5px] text-gray-500 italic line-clamp-2 mb-3 flex items-start gap-1.5">
              <span>💡</span>
              <span>{item.ambience}</span>
            </p>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-1 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {isDone ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sudah Dieksekusi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                Menunggu Eksekusi
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-[#1F6FB6] hover:bg-gray-100 rounded-lg transition-colors"
              title="Salin Copywriting"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(item);
              }}
              className="p-1.5 text-gray-400 hover:text-[#1F6FB6] hover:bg-gray-100 rounded-lg transition-colors"
              title="Preview Instagram"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
