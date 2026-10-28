"use client";

import React, { useState } from "react";
import { 
  Copy, 
  Check, 
  Eye, 
  Edit2, 
  Trash2, 
  Camera
} from "lucide-react";
import { ContentItem } from "@/lib/firebase";

interface ContentTableProps {
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onPreview: (item: ContentItem) => void;
  onStatusChange: (item: ContentItem, newStatus: ContentItem["status"]) => void;
}

export default function ContentTable({
  items,
  onEdit,
  onDelete,
  onPreview,
  onStatusChange
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

  const statusColors = {
    "Siap Tayang": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Terjadwal": "bg-amber-50 text-amber-700 border-amber-200",
    "Draft": "bg-slate-100 text-slate-700 border-slate-200",
    "Sudah Tayang": "bg-blue-50 text-blue-700 border-blue-200"
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-12 text-center">No</th>
              <th className="py-3.5 px-4 min-w-[130px]">Kategori</th>
              <th className="py-3.5 px-4 min-w-[200px]">Judul Konten</th>
              <th className="py-3.5 px-4 min-w-[240px]">Teks Copywriting</th>
              <th className="py-3.5 px-4 min-w-[220px]">Arahan Visual</th>
              <th className="py-3.5 px-4 min-w-[120px]">Status</th>
              <th className="py-3.5 px-4 min-w-[100px]">Format</th>
              <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const currentStatus = item.status || "Siap Tayang";
              return (
                <tr 
                  key={item.id || item.no}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* No */}
                  <td className="py-3 px-4 text-center font-bold text-slate-700">
                    <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center mx-auto text-slate-700 group-hover:bg-[#1F6FB6] group-hover:text-white transition-colors">
                      {item.no}
                    </span>
                  </td>

                  {/* Kategori */}
                  <td className="py-3 px-4">
                    <span className="font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#1F6FB6] border border-blue-100">
                      {item.kategori}
                    </span>
                  </td>

                  {/* Judul */}
                  <td className="py-3 px-4 font-bold text-slate-900 max-w-[220px]">
                    <div className="line-clamp-2" title={item.judul}>
                      {item.judul}
                    </div>
                  </td>

                  {/* Copywriting */}
                  <td className="py-3 px-4">
                    <div className="flex items-start justify-between gap-1">
                      <p className="line-clamp-2 text-slate-600 font-mono text-[11px] leading-tight">
                        {item.copywriting}
                      </p>
                      <button
                        onClick={() => copyText(`copy-${item.no}`, item.copywriting)}
                        className="p-1 text-slate-400 hover:text-[#1F6FB6] transition-colors shrink-0"
                        title="Salin Copywriting"
                      >
                        {copiedId === `copy-${item.no}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Ambience */}
                  <td className="py-3 px-4 text-slate-500">
                    <div className="line-clamp-2 text-[11px]" title={item.ambience}>
                      {item.ambience}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-4">
                    <select
                      value={currentStatus}
                      onChange={(e) => onStatusChange(item, e.target.value as any)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                        statusColors[currentStatus as keyof typeof statusColors] || statusColors.Draft
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Siap Tayang">Siap Tayang</option>
                      <option value="Terjadwal">Terjadwal</option>
                      <option value="Sudah Tayang">Sudah Tayang</option>
                    </select>
                  </td>

                  {/* Platform */}
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                      {item.platform || "Instagram Feed"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onPreview(item)}
                        className="p-1 text-slate-500 hover:text-[#1F6FB6] hover:bg-blue-50 rounded"
                        title="Preview Instagram"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Edit Konten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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
