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
  FileText
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentCardProps {
  item: ContentItem;
  onToggleExecuted: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
}

export default function ContentCard({
  item,
  onToggleExecuted,
  onEdit,
  onDelete,
  onPreview
}: ContentCardProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedCopywriting, setCopiedCopywriting] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const isDone = Boolean(item.executed);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(item.caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCopywriting = async () => {
    try {
      await navigator.clipboard.writeText(item.copywriting);
      setCopiedCopywriting(true);
      setTimeout(() => setCopiedCopywriting(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 flex flex-col justify-between transition-all relative group ${
      isDone 
        ? "border-[#E9E9E7] bg-[#FAFAFA]" 
        : "border-[#E9E9E7] hover:border-[#D3D1CB] hover:shadow-xs"
    }`}>
      {/* Top Header: Checkbox + Number + Category */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {/* Notion Checkbox Label */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDone}
              onChange={() => onToggleExecuted(item)}
              className="notion-checkbox"
            />
            <span className={`text-xs font-medium ${
              isDone ? "text-[#2B7830] font-semibold" : "text-[#787774]"
            }`}>
              {isDone ? "Sudah Dieksekusi" : "Belum Eksekusi"}
            </span>
          </label>

          <span className="text-xs font-mono text-[#9B9A97]">
            #{item.no}
          </span>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onPreview(item)}
          className={`text-sm font-semibold mb-2 leading-snug cursor-pointer transition-colors ${
            isDone 
              ? "line-through text-[#9B9A97]" 
              : "text-[#37352F] hover:text-[#1F6FB6]"
          }`}
        >
          {item.judul}
        </h3>

        {/* Category Pill */}
        <div className="mb-3">
          <span className="notion-tag bg-[#E8F3FA] text-[#1F6FB6]">
            {item.kategori}
          </span>
        </div>

        {/* Copywriting Block */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#9B9A97]">
              Teks Visual Feed
            </span>
            <button
              onClick={handleCopyCopywriting}
              className="text-[11px] text-[#787774] hover:text-[#1F6FB6] flex items-center gap-1"
            >
              {copiedCopywriting ? (
                <>
                  <Check className="w-3 h-3 text-[#2B7830]" />
                  <span className="text-[#2B7830]">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
          <div className="notion-callout font-mono max-h-32 overflow-y-auto text-[11.5px] leading-relaxed text-[#37352F]">
            {item.copywriting}
          </div>
        </div>

        {/* Ambience note */}
        <div className="mb-3">
          <p className="text-[11.5px] text-[#787774] line-clamp-2 italic">
            💡 {item.ambience}
          </p>
        </div>

        {/* Caption */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#9B9A97]">
              Caption
            </span>
            <button
              onClick={handleCopyCaption}
              className="text-[11px] text-[#787774] hover:text-[#1F6FB6] flex items-center gap-1"
            >
              {copiedCaption ? (
                <>
                  <Check className="w-3 h-3 text-[#2B7830]" />
                  <span className="text-[#2B7830]">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Caption</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-[#F7F6F3] p-2.5 rounded border border-[#E9E9E7] text-[11.5px] text-[#37352F]">
            <p className={`whitespace-pre-line leading-relaxed ${!expandedCaption ? "line-clamp-2" : ""}`}>
              {item.caption}
            </p>
            {item.caption.length > 100 && (
              <button
                onClick={() => setExpandedCaption(!expandedCaption)}
                className="text-[10.5px] text-[#1F6FB6] hover:underline mt-1 block cursor-pointer"
              >
                {expandedCaption ? "Sembunyikan" : "Selengkapnya..."}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-[#E9E9E7] flex items-center justify-between text-xs text-[#787774] mt-2">
        <span className="text-[11px]">
          {item.platform || "Instagram Feed"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPreview(item)}
            className="p-1 hover:text-[#1F6FB6] hover:bg-[#F7F6F3] rounded"
            title="Preview Mockup"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1 hover:text-[#D9730D] hover:bg-[#F7F6F3] rounded"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1 hover:text-[#DF5452] hover:bg-[#FDEBEC] rounded"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
