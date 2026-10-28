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

// 6 Color Themes Matching Reference Image (Cyclic by item.no for balanced variety)
const THEMES = [
  {
    outerBg: "bg-[#FDF0F3]",
    outerBorder: "border-[#FBD4DC]",
    headerText: "text-[#D13B63]",
    tag1: { bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
    tag2: { bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
  },
  {
    outerBg: "bg-[#EFF5FE]",
    outerBorder: "border-[#D6E5FD]",
    headerText: "text-[#2463EB]",
    tag1: { bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
    tag2: { bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
  },
  {
    outerBg: "bg-[#F7F5F0]",
    outerBorder: "border-[#E9E6DC]",
    headerText: "text-[#4A473F]",
    tag1: { bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
    tag2: { bg: "bg-[#F4F3EF]", text: "text-[#4D4B46]", border: "border-[#E5E3DD]" },
  },
  {
    outerBg: "bg-[#EFF7EE]",
    outerBorder: "border-[#D7EED5]",
    headerText: "text-[#2E7D32]",
    tag1: { bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
    tag2: { bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
  },
  {
    outerBg: "bg-[#FEF5EB]",
    outerBorder: "border-[#FCE4CD]",
    headerText: "text-[#C2621C]",
    tag1: { bg: "bg-[#FAF0E4]", text: "text-[#A66827]", border: "border-[#F2DECE]" },
    tag2: { bg: "bg-[#EAF6ED]", text: "text-[#2F7E41]", border: "border-[#D0ECD7]" },
  },
  {
    outerBg: "bg-[#F8F2FE]",
    outerBorder: "border-[#EBDCFC]",
    headerText: "text-[#7C3AED]",
    tag1: { bg: "bg-[#F8F2FE]", text: "text-[#7C3AED]", border: "border-[#EBDCFC]" },
    tag2: { bg: "bg-[#EBF2FE]", text: "text-[#2965CC]", border: "border-[#D0E1FD]" },
  }
];

function getSmartphoneTags(title: string = "", category: string = "") {
  const t = title.toLowerCase();
  const c = category.toLowerCase();

  if (t.includes("ram")) return [{ label: "RAM ⚡" }, { label: "Hardware ⚙️" }];
  if (t.includes("storage") || t.includes("emmc") || t.includes("ufs")) return [{ label: "Storage 💾" }, { label: "Performa 🚀" }];
  if (t.includes("layar") || t.includes("refresh rate") || t.includes("hz")) return [{ label: "Layar 📱" }, { label: "Refresh Rate 👁️" }];
  if (t.includes("amoled") || t.includes("ips lcd") || t.includes("panel")) return [{ label: "Display 📱" }, { label: "AMOLED ✨" }];
  if (t.includes("kamera") || t.includes("ois") || t.includes("mp")) return [{ label: "Kamera 📸" }, { label: "OIS Stabilizer 🎯" }];
  if (t.includes("charger") || t.includes("ngecas") || t.includes("watt") || t.includes("baterai")) return [{ label: "Baterai 🔋" }, { label: "Fast Charging ⚡" }];
  if (t.includes("nfc")) return [{ label: "NFC 💳" }, { label: "Fitur Pintar 📡" }];
  if (t.includes("iphone") || t.includes("apple") || t.includes("ios")) return [{ label: "iPhone 📱" }, { label: "Apple 🍎" }];
  if (t.includes("samsung")) return [{ label: "Samsung 📱" }, { label: "Galaxy ✨" }];
  if (t.includes("xiaomi") || t.includes("redmi") || t.includes("poco")) return [{ label: "Xiaomi 📱" }, { label: "Value King 🔥" }];
  if (t.includes("vivo")) return [{ label: "Vivo 📱" }, { label: "Portrait 📸" }];
  if (t.includes("oppo")) return [{ label: "Oppo 📱" }, { label: "Desain 💎" }];
  if (t.includes("infinix") || t.includes("tecno")) return [{ label: "Gaming 🎮" }, { label: "Budget 💰" }];
  if (t.includes("tips") || t.includes("rawat") || t.includes("awet")) return [{ label: "Tips 💡" }, { label: "Perawatan 🛠️" }];
  if (t.includes("second") || t.includes("bekas")) return [{ label: "Like New ✨" }, { label: "Garansi Toko 🛡️" }];
  if (c.includes("edukasi")) return [{ label: "Edukasi 💡" }, { label: "Gadget Guide 📱" }];
  if (c.includes("promo")) return [{ label: "Promo Spesial 🔥" }, { label: "Best Deal 🏷️" }];

  return [{ label: "Gadget 📱" }, { label: "Semarang Cell ✨" }];
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

  const themeIndex = (item.no - 1) % THEMES.length;
  const theme = THEMES[themeIndex >= 0 ? themeIndex : 0];
  const tags = getSmartphoneTags(item.judul, item.kategori);

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
      rounded-[24px] ${theme.outerBg} border ${theme.outerBorder}
      p-3 pb-3.5 flex flex-col justify-between transition-all duration-200
      hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] relative group w-full
    `}>
      {/* Outer Header: Category Title + Checkbox + Plus + Menu */}
      <div className="flex items-center justify-between px-2 mb-2.5">
        <h4 className={`font-bold text-[15.5px] tracking-tight truncate ${theme.headerText}`}>
          {item.kategori || "Konten"}
        </h4>

        {/* Right Tools: Checkbox, Plus, Menu */}
        <div className="flex items-center gap-2">
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
            title="Tambah Konten Baru"
          >
            <Plus className="w-3.5 h-3.5" />
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
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div 
                className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-150 py-1 z-20 text-xs text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(item);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  <span>Edit Konten</span>
                </button>
                <button
                  onClick={(e) => {
                    setShowMenu(false);
                    handleCopy(e);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 font-medium"
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
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inner White Card: Matches reference screenshot proportions */}
      <div 
        onClick={() => onPreview(item)}
        className="bg-white rounded-[18px] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-white cursor-pointer flex flex-col justify-between flex-1 transition-all group/inner hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] min-h-[290px]"
      >
        <div>
          {/* Tag Badges with Emoji */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold tracking-wide border ${theme.tag1.bg} ${theme.tag1.text} ${theme.tag1.border}`}>
              {tags[0].label}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold tracking-wide border ${theme.tag2.bg} ${theme.tag2.text} ${theme.tag2.border}`}>
              {tags[1].label}
            </span>
            <span className="ml-auto font-mono text-[10.5px] text-[#A1A1AA] font-medium">
              #{item.no}
            </span>
          </div>

          {/* Big Bold Title */}
          <h3 className={`text-[17px] sm:text-[18px] font-extrabold text-[#111111] leading-[1.3] tracking-tight mb-1 transition-colors group-hover/inner:text-[#1F6FB6] ${
            isDone ? "line-through text-[#A1A1AA]" : ""
          }`}>
            {item.judul}
          </h3>

          {/* Subtitle */}
          <p className="text-[12px] text-[#8E8E93] font-normal mb-3">
            Brief #{item.no} • {item.platform || "Instagram Feed"}
          </p>

          {/* Body Content / Copywriting */}
          <div className="text-[12px] text-[#48484A] leading-[1.6] line-clamp-4 font-normal mb-2">
            {item.copywriting || item.caption}
          </div>

          {/* Ambience visual note */}
          {item.ambience && (
            <p className="text-[11px] text-[#8E8E93] italic line-clamp-2 mt-2 pt-2 border-t border-[#F2F2F7] leading-relaxed">
              💡 {item.ambience}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
