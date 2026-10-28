"use client";

import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Eye, 
  Edit2, 
  Trash2, 
  FileText,
  Camera
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentTableProps {
  items: ContentItem[];
  onToggleExecuted: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
}

// Category Color Map in Notion aesthetic
function getCategoryTagStyle(category: string): { bg: string; text: string } {
  if (category.includes("Edukasi") || category.includes("Spesifikasi")) {
    return { bg: "bg-[#E8F3FA]", text: "text-[#1F6FB6]" };
  }
  if (category.includes("Promo") || category.includes("Penawaran")) {
    return { bg: "bg-[#FAEBDD]", text: "text-[#D9730D]" };
  }
  if (category.includes("Perbandingan")) {
    return { bg: "bg-[#F3EDF7]", text: "text-[#6940A5]" };
  }
  if (category.includes("Rekomendasi") || category.includes("Kebutuhan")) {
    return { bg: "bg-[#E7F3E8]", text: "text-[#2B7830]" };
  }
  if (category.includes("Tips") || category.includes("Perawatan")) {
    return { bg: "bg-[#FDEBEC]", text: "text-[#DF5452]" };
  }
  return { bg: "bg-[#EFEFED]", text: "text-[#5A5A58]" };
}

export default function ContentTable({
  items,
  onToggleExecuted,
  onEdit,
  onDelete,
  onPreview
}: ContentTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="border border-[#E9E9E7] rounded-lg overflow-hidden bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="notion-th w-10 text-center">
                <span title="Status Eksekusi">✓</span>
              </th>
              <th className="notion-th w-14 text-center">#No</th>
              <th className="notion-th min-w-[220px]">Judul Konten</th>
              <th className="notion-th min-w-[150px]">Kategori</th>
              <th className="notion-th min-w-[260px]">Teks Copywriting (Visual)</th>
              <th className="notion-th min-w-[220px]">Arahan Visual</th>
              <th className="notion-th min-w-[130px]">Format</th>
              <th className="notion-th w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const tagStyle = getCategoryTagStyle(item.kategori);
              const isDone = Boolean(item.executed);

              return (
                <tr 
                  key={item.id || item.no}
                  className={`notion-row ${isDone ? "is-executed" : ""}`}
                >
                  {/* Notion Checkbox for Execution */}
                  <td className="notion-td text-center">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => onToggleExecuted(item)}
                      className="notion-checkbox cursor-pointer"
                      title={isDone ? "Tandai belum dieksekusi" : "Tandai sudah dieksekusi"}
                    />
                  </td>

                  {/* No */}
                  <td className="notion-td text-center font-mono text-xs text-[#787774]">
                    #{item.no}
                  </td>

                  {/* Judul Konten */}
                  <td className="notion-td">
                    <div 
                      onClick={() => onPreview(item)}
                      className="flex items-center gap-2 cursor-pointer group/title"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#787774] shrink-0 group-hover/title:text-[#1F6FB6]" />
                      <span className="notion-title-text font-medium text-xs leading-snug group-hover/title:text-[#1F6FB6] transition-colors">
                        {item.judul}
                      </span>
                    </div>
                  </td>

                  {/* Kategori Pill */}
                  <td className="notion-td">
                    <span className={`notion-tag ${tagStyle.bg} ${tagStyle.text}`}>
                      {item.kategori}
                    </span>
                  </td>

                  {/* Copywriting */}
                  <td className="notion-td">
                    <div className="flex items-start justify-between gap-1 group/copy">
                      <p className="line-clamp-2 text-[#787774] font-mono text-[11px] leading-relaxed">
                        {item.copywriting}
                      </p>
                      <button
                        onClick={() => copyText(`copy-${item.no}`, item.copywriting)}
                        className="p-1 rounded text-[#9B9A97] hover:text-[#1F6FB6] hover:bg-[#F7F6F3] transition-colors shrink-0"
                        title="Salin Copywriting"
                      >
                        {copiedId === `copy-${item.no}` ? (
                          <Check className="w-3 h-3 text-[#2B7830]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Ambience */}
                  <td className="notion-td">
                    <p className="line-clamp-2 text-[#787774] text-xs">
                      {item.ambience}
                    </p>
                  </td>

                  {/* Platform */}
                  <td className="notion-td">
                    <span className="text-[11px] text-[#787774] bg-[#F7F6F3] border border-[#E9E9E7] px-2 py-0.5 rounded">
                      {item.platform || "Instagram Feed"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="notion-td text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onPreview(item)}
                        className="p-1 text-[#787774] hover:text-[#1F6FB6] hover:bg-[#F7F6F3] rounded"
                        title="Preview Instagram"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-[#787774] hover:text-[#D9730D] hover:bg-[#F7F6F3] rounded"
                        title="Edit Konten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1 text-[#787774] hover:text-[#DF5452] hover:bg-[#FDEBEC] rounded"
                        title="Hapus Konten"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
