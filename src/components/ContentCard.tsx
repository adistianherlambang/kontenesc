"use client";

import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Eye, 
  Edit2, 
  Trash2, 
  Camera, 
  MessageSquare, 
  Layers,
  Calendar,
  Share2
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentCardProps {
  item: ContentItem;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
  onStatusChange: (item: ContentItem, newStatus: ContentItem["status"]) => void;
}

export default function ContentCard({
  item,
  onEdit,
  onDelete,
  onPreview,
  onStatusChange
}: ContentCardProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedCopywriting, setCopiedCopywriting] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(item.caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error("Failed to copy caption", err);
    }
  };

  const handleCopyCopywriting = async () => {
    try {
      await navigator.clipboard.writeText(item.copywriting);
      setCopiedCopywriting(true);
      setTimeout(() => setCopiedCopywriting(false), 2000);
    } catch (err) {
      console.error("Failed to copy copywriting", err);
    }
  };

  // Status Badge Colors
  const statusColors = {
    "Siap Tayang": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Terjadwal": "bg-amber-50 text-amber-700 border-amber-200",
    "Draft": "bg-slate-100 text-slate-700 border-slate-200",
    "Sudah Tayang": "bg-blue-50 text-blue-700 border-blue-200"
  };

  const currentStatus = item.status || "Siap Tayang";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between content-card-hover relative group">
      {/* Top Header: Number, Category, Status & Platform */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1F6FB6] to-[#0E487B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              #{item.no}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1F6FB6] border border-blue-100 truncate max-w-[170px]">
              {item.kategori}
            </span>
          </div>

          {/* Quick Status Dropdown */}
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(item, e.target.value as any)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none transition-colors ${
              statusColors[currentStatus as keyof typeof statusColors] || statusColors.Draft
            }`}
          >
            <option value="Draft">Draft</option>
            <option value="Siap Tayang">Siap Tayang</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Sudah Tayang">Sudah Tayang</option>
          </select>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1F6FB6] transition-colors leading-snug mb-3">
          {item.judul}
        </h3>

        {/* Copywriting Section */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#1F6FB6]" /> Teks Konten / Feed
            </span>
            <button
              onClick={handleCopyCopywriting}
              className="text-[11px] font-medium text-slate-500 hover:text-[#1F6FB6] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
              title="Salin copywriting ke clipboard"
            >
              {copiedCopywriting ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
          <div className="copy-box p-3 max-h-36 overflow-y-auto">
            {item.copywriting}
          </div>
        </div>

        {/* Visual Ambience Direction */}
        <div className="mb-3.5">
          <div className="flex items-center gap-1 mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Camera className="w-3 h-3 text-blue-600" /> Arahan Visual / Ambience
          </div>
          <div className="ambience-box">
            <p className="line-clamp-2 text-xs">
              {item.ambience}
            </p>
          </div>
        </div>

        {/* Caption Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-indigo-500" /> Caption Instagram
            </span>
            <button
              onClick={handleCopyCaption}
              className="text-[11px] font-medium text-slate-500 hover:text-[#1F6FB6] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
              title="Salin caption ke clipboard"
            >
              {copiedCaption ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Caption</span>
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-200/70">
            <p className={`whitespace-pre-line leading-relaxed ${!expandedCaption ? "line-clamp-3" : ""}`}>
              {item.caption}
            </p>
            {item.caption.length > 120 && (
              <button
                onClick={() => setExpandedCaption(!expandedCaption)}
                className="text-[11px] font-semibold text-[#1F6FB6] hover:underline mt-1.5 block cursor-pointer"
              >
                {expandedCaption ? "Sembunyikan" : "Baca Selengkapnya..."}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Metadata & Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            {item.platform || "Instagram Feed"}
          </span>
          {item.targetDate && (
            <span className="hidden sm:flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.targetDate}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview(item)}
            className="p-1.5 text-slate-500 hover:text-[#1F6FB6] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Lihat Pratinjau Instagram"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Konten"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Konten"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
